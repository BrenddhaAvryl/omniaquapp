/**
 * OmniAqua - Firmware Oficial ESP8266
 * Projeto: Dosador Automatizado para Aquários
 * Arquitetura: MQTT Subscriber Não-Bloqueante com ArduinoJson e Fail-Safe
 */

#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// Se existir config.h utiliza, senão recorre aos padrões de fallback
#if __has_include("config.h")
  #include "config.h"
#else
  #include "config.example.h"
#endif

// Instâncias de Rede
WiFiClient espClient;
PubSubClient mqttClient(espClient);

// Variáveis de Controle Não-Bloqueante de Dosagem
bool bombaLigada = false;
unsigned long tempoFimDosagem = 0;
unsigned long tempoInicioDosagem = 0;
unsigned long duracaoExecutadaMs = 0;
char comandoIdAtual[48] = {0};

// Temporizador de reconexão MQTT sem travar o loop
unsigned long ultimoTentativaMQTT = 0;

// ========================================================
// Protótipos de Funções
// ========================================================
void setupWiFi();
void reconectaMQTT();
void callbackMQTT(char* topic, byte* payload, unsigned int length);
void publicaStatus(const char* comandoId, int idBomba, const char* status, unsigned long tempoMs);

// ========================================================
// SETUP
// ========================================================
void setup() {
  Serial.begin(115200);
  delay(100);
  Serial.println();
  Serial.println(F("========================================"));
  Serial.println(F("   OmniAqua - Firmware ESP8266 v1.0    "));
  Serial.println(F("========================================"));

  // Configuração Segura dos Pinos
  // Garante que o pino inicia em nível BAIXO (Bomba Desligada)
  pinMode(PINO_BOMBA_1, OUTPUT);
  digitalWrite(PINO_BOMBA_1, LOW);

  setupWiFi();

  // Configuração do Cliente MQTT
  mqttClient.setServer(MQTT_HOST, MQTT_PORT);
  mqttClient.setCallback(callbackMQTT);
  mqttClient.setBufferSize(512); // Buffer suficiente para payloads JSON
}

// ========================================================
// LOOP PRINCIPAL (Não-Bloqueante)
// ========================================================
void loop() {
  // 1. Manutenção da Conexão Wi-Fi
  if (WiFi.status() != WL_CONNECTED) {
    setupWiFi();
  }

  // 2. Manutenção da Conexão MQTT (Tentativa a cada 5 segundos)
  if (!mqttClient.connected()) {
    unsigned long agora = millis();
    if (agora - ultimoTentativaMQTT > 5000) {
      ultimoTentativaMQTT = agora;
      reconectaMQTT();
    }
  } else {
    mqttClient.loop();
  }

  // 3. Gerenciamento do Motor via millis()
  // Se o tempo da dosagem expirou, desliga o MOSFET e envia o ACK
  if (bombaLigada && (millis() >= tempoFimDosagem)) {
    digitalWrite(PINO_BOMBA_1, LOW);
    bombaLigada = false;
    duracaoExecutadaMs = millis() - tempoInicioDosagem;

    Serial.printf("[BOMBA 1] Dosagem finalizada. Tempo real: %lu ms\n", duracaoExecutadaMs);
    publicaStatus(comandoIdAtual, 1, "CONCLUIDO", duracaoExecutadaMs);
  }
}

// ========================================================
// Conexão Wi-Fi
// ========================================================
void setupWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.printf("\n[WIFI] Conectando a %s ", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int tentativas = 0;
  while (WiFi.status() != WL_CONNECTED && tentativas < 25) {
    delay(400);
    Serial.print(".");
    tentativas++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println(F("\n[WIFI] Conectado com sucesso!"));
    Serial.printf("[WIFI] IP Obtido: %s | RSSI: %d dBm\n", WiFi.localIP().toString().c_str(), WiFi.RSSI());
  } else {
    Serial.println(F("\n[WIFI] Falha ao conectar. Tentará novamente no loop."));
  }
}

// ========================================================
// Reconexão MQTT com Last Will (LWT)
// ========================================================
void reconectaMQTT() {
  Serial.print(F("[MQTT] Conectando ao Broker... "));

  // Last Will: se a placa perder conexão abruptamente, o broker publica "offline"
  bool conectado = false;
  if (strlen(MQTT_USER) > 0) {
    conectado = mqttClient.connect(MQTT_CLIENT_ID, MQTT_USER, MQTT_PASS, TOPICO_LWT, 1, true, "offline");
  } else {
    conectado = mqttClient.connect(MQTT_CLIENT_ID, TOPICO_LWT, 1, true, "offline");
  }

  if (conectado) {
    Serial.println(F("Conectado!"));
    
    // Notifica que o dispositivo está online com retain flag
    mqttClient.publish(TOPICO_LWT, "online", true);

    // Assina o tópico de comando de dosagem com QoS 1
    mqttClient.subscribe(TOPICO_COMANDO, 1);
    Serial.printf("[MQTT] Inscrito no tópico: %s\n", TOPICO_COMANDO);
  } else {
    Serial.printf("Falha. Codigo de erro rc=%d\n", mqttClient.state());
  }
}

// ========================================================
// Callback de Mensagens MQTT Recebidas
// ========================================================
void callbackMQTT(char* topic, byte* payload, unsigned int length) {
  Serial.printf("\n[MQTT RX] Tópico: %s | Bytes: %u\n", topic, length);

  // Copia o payload para um buffer seguro terminado em null
  char jsonBuffer[512];
  if (length >= sizeof(jsonBuffer)) {
    Serial.println(F("[ERRO] Payload recebido maior que o buffer permitido."));
    return;
  }
  memcpy(jsonBuffer, payload, length);
  jsonBuffer[length] = '\0';

  // Decodificação JSON
  StaticJsonDocument<384> doc;
  DeserializationError erro = deserializeJson(doc, jsonBuffer);
  if (erro) {
    Serial.printf("[ERRO] Falha ao desserializar JSON: %s\n", erro.c_str());
    return;
  }

  const char* comandoId = doc["comando_id"];
  int idBomba = doc["id_bomba"];
  unsigned long tempoMs = doc["tempo_ms"];

  if (!comandoId) {
    Serial.println(F("[ERRO] Payload sem 'comando_id'. Descartando."));
    return;
  }

  Serial.printf("[COMANDO] ID: %s | Bomba: %d | Tempo: %lu ms\n", comandoId, idBomba, tempoMs);

  // 1. Validação de ID da Bomba
  if (idBomba != 1) {
    Serial.printf("[ERRO] Bomba %d não mapeada nesta unidade.\n", idBomba);
    publicaStatus(comandoId, idBomba, "ERRO_BOMBA_NAO_ENCONTRADA", 0);
    return;
  }

  // 2. Validação de Ocupação
  if (bombaLigada) {
    Serial.println(F("[AVISO] Bomba ocupada executando outra dosagem."));
    publicaStatus(comandoId, idBomba, "ERRO_DISPOSITIVO_OCUPADO", 0);
    return;
  }

  // 3. Validação de Parâmetros e Fail-Safe Máximo
  if (tempoMs <= 0 || tempoMs > TEMPO_MAX_SEGURANCA_MS) {
    Serial.printf("[SEGURANCA] Tempo solicitado (%lu ms) inválido ou acima do limite seguro (%d ms)!\n",
                  tempoMs, TEMPO_MAX_SEGURANCA_MS);
    publicaStatus(comandoId, idBomba, "ERRO_PARAMETRO_INVALIDO", 0);
    return;
  }

  // 4. Execução Não-Bloqueante
  strncpy(comandoIdAtual, comandoId, sizeof(comandoIdAtual) - 1);
  tempoInicioDosagem = millis();
  tempoFimDosagem = tempoInicioDosagem + tempoMs;
  bombaLigada = true;
  digitalWrite(PINO_BOMBA_1, HIGH);

  Serial.printf("[BOMBA 1] Acionada por %lu ms...\n", tempoMs);
}

// ========================================================
// Publicação de Confirmação (ACK) e Telemetria
// ========================================================
void publicaStatus(const char* comandoId, int idBomba, const char* status, unsigned long tempoMs) {
  StaticJsonDocument<256> doc;
  doc["comando_id"] = comandoId;
  doc["id_bomba"] = idBomba;
  doc["status"] = status;
  doc["tempo_executado_ms"] = tempoMs;
  doc["rssi"] = WiFi.RSSI();
  doc["uptime_s"] = millis() / 1000;

  char saida[256];
  size_t len = serializeJson(doc, saida);

  if (mqttClient.publish(TOPICO_STATUS, (const uint8_t*)saida, len, false)) {
    Serial.printf("[MQTT TX] Status publicado com sucesso: %s\n", status);
  } else {
    Serial.println(F("[ERRO] Falha ao publicar status MQTT."));
  }
}

