#ifndef CONFIG_H
#define CONFIG_H

// ========================================================
// Configurações de Rede Wi-Fi
// Copie este arquivo para "config.h" e insira suas credenciais locais
// ========================================================
const char* const WIFI_SSID = "SEU_WIFI_AQUI";
const char* const WIFI_PASSWORD = "SUA_SENHA_AQUI";

// ========================================================
// Configurações do Broker MQTT
// ========================================================
const char* const MQTT_HOST = "192.168.1.100"; // IP da sua máquina ou servidor local
const int MQTT_PORT = 1883;
const char* const MQTT_CLIENT_ID = "OmniAqua_ESP8266_Node01";
const char* const MQTT_USER = "";     // Deixe vazio se allow_anonymous = true
const char* const MQTT_PASS = "";

// ========================================================
// Tópicos MQTT do OmniAqua
// ========================================================
const char* const TOPICO_COMANDO = "omniaqua/bombas/comando";
const char* const TOPICO_STATUS  = "omniaqua/bombas/status";
const char* const TOPICO_LWT     = "omniaqua/dispositivo/status";

// ========================================================
// Mapeamento de Hardware e Segurança
// ========================================================
// No NodeMCU/ESP8266: D1 corresponde ao GPIO 5
#define PINO_BOMBA_1 D1 

// Trava de segurança no Firmware: acionamento máximo contínuo de 30 segundos
#define TEMPO_MAX_SEGURANCA_MS 30000

#endif // CONFIG_H

