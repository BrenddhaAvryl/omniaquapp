export default class PumpService {
  constructor(apiUrl = "http://localhost:3000/api") {
    this.apiUrl = apiUrl;
  }

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

    try {
      const resposta = await fetch(`${this.apiUrl}/bombas/${id}/dosar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ volume_ml: volume }),
      });
      if (resposta.ok) {
        const dados = await resposta.json();
        console.log("[PumpService] Dose confirmada pela API:", dados);
        return dados;
      }
    } catch {
      // Backend offline: fallback automático para modo simulado
      console.info("[PumpService] Backend offline: operando em modo de simulação local.");
    }

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

    try {
      const resposta = await fetch(`${this.apiUrl}/agendamentos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bomba_id: id, volume_ml: volume, horario: time }),
      });
      if (resposta.ok) {
        const dados = await resposta.json();
        console.log("[PumpService] Agendamento registrado pela API:", dados);
        return dados;
      }
    } catch {
      console.info("[PumpService] Backend offline: operando em modo de simulação local.");
    }

    await Promise.resolve();
    console.log(payload);
    return payload;
  }
}
