/**
 * Módulo de Calibração e Conversão de Grandezas
 * Transforma volume líquido desejado em tempo de acionamento do motor da bomba
 */

export const TEMPO_MAX_SEGURANCA_MS = 30000; // 30 segundos
export const TEMPO_MIN_ACIONAMENTO_MS = 100; // 100 milissegundos

/**
 * Converte volume (ml) em tempo de acionamento (ms) com base na vazão nominal (ml/min)
 * Fórmula: tempo_ms = (volume_ml / vazao_ml_min) * 60.000 ms
 * 
 * @param {number} volumeMl Volume líquido a dosar em ml
 * @param {number} vazaoMlMin Vazão calibrada da bomba em ml/minuto
 * @returns {number} Tempo de acionamento em milissegundos
 */
export function calcularTempoAcionamentoMs(volumeMl, vazaoMlMin = 60.0) {
  const vol = Number(volumeMl);
  const vazao = Number(vazaoMlMin);

  if (!Number.isFinite(vol) || vol <= 0) {
    throw new Error("Volume a dosar deve ser um número positivo maior que zero.");
  }

  if (!Number.isFinite(vazao) || vazao <= 0) {
    throw new Error("Vazão da bomba deve ser maior que zero para cálculo de calibração.");
  }

  const tempoCalculado = Math.round((vol / vazao) * 60000);

  // Aplicação da trava máxima de segurança (Fail-Safe)
  if (tempoCalculado > TEMPO_MAX_SEGURANCA_MS) {
    console.warn(
      `[CALIBRAÇÃO] Tempo calculado (${tempoCalculado} ms) excedeu o teto seguro. Limitando a ${TEMPO_MAX_SEGURANCA_MS} ms.`
    );
    return TEMPO_MAX_SEGURANCA_MS;
  }

  return Math.max(tempoCalculado, TEMPO_MIN_ACIONAMENTO_MS);
}
