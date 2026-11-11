export default class PumpService {
  getPumps() {
    return [
      { id: 1, solucao: "Solução A", cor: "#74e3d2", volume: 5, horario: "08:00" },
      { id: 2, solucao: "Solução B", cor: "#94cfff", volume: 5, horario: "08:00" },
      { id: 3, solucao: "Solução C", cor: "#c3b4fa", volume: 5, horario: "08:00" }
    ];
  }

  validateDose(id, volume) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error("Identificador de bomba inválido.");
    }
    if (!Number.isFinite(volume) || volume <= 0) {
      throw new Error("Informe um volume maior que zero.");
    }
  }

  async doseNow(id, volume) {
    this.validateDose(id, volume);
    const payload = { id_bomba: id, volume_ml: volume };
    // Simula o envio assíncrono. A futura chamada fetch fica nesta camada.
    await Promise.resolve();
    console.log(payload);
    return payload;
  }

  async scheduleDose(id, volume, time) {
    this.validateDose(id, volume);
    if (typeof time !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
      throw new Error("Informe um horário válido no formato HH:MM.");
    }
    const payload = { id_bomba: id, volume_ml: volume, horario: time };
    await Promise.resolve();
    console.log(payload);
    return payload;
  }
}
