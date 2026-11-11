-- ========================================================
-- Schema Oficial OmniAqua - PostgreSQL
-- ========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela de Configuração e Calibração das Bombas
CREATE TABLE IF NOT EXISTS bombas (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    solucao VARCHAR(50) NOT NULL,
    cor VARCHAR(20) NOT NULL DEFAULT '#74e3d2',
    pino_gpio INT NOT NULL, -- GPIO5 = D1 na ESP8266
    vazao_ml_min NUMERIC(6,2) NOT NULL DEFAULT 60.00, -- Calibração: ml por minuto da bomba Kamoer
    capacidade_recipiente_ml NUMERIC(7,2) DEFAULT 1000.00,
    volume_restante_ml NUMERIC(7,2) DEFAULT 1000.00,
    ativo BOOLEAN DEFAULT true,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Agendamentos Diários
CREATE TABLE IF NOT EXISTS agendamentos (
    id SERIAL PRIMARY KEY,
    bomba_id INT NOT NULL REFERENCES bombas(id) ON DELETE CASCADE,
    volume_ml NUMERIC(5,2) NOT NULL CHECK (volume_ml > 0),
    horario TIME NOT NULL, -- Ex: '08:00:00'
    dias_semana VARCHAR(20) DEFAULT 'ALL', -- 'ALL' ou dias separados por vírgula '1,2,3,4,5,6,7'
    ativo BOOLEAN DEFAULT true,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de Auditoria e Histórico de Dosagens
CREATE TABLE IF NOT EXISTS historico_dosagens (
    id SERIAL PRIMARY KEY,
    comando_id UUID NOT NULL UNIQUE,
    bomba_id INT NOT NULL REFERENCES bombas(id),
    volume_ml NUMERIC(5,2) NOT NULL,
    tempo_ms INT NOT NULL,
    tipo_disparo VARCHAR(20) NOT NULL, -- 'MANUAL' ou 'AGENDADO'
    status VARCHAR(30) NOT NULL DEFAULT 'PENDENTE', -- 'PENDENTE', 'ENVIADO', 'CONCLUIDO', 'FALHA'
    disparado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmado_em TIMESTAMP WITH TIME ZONE
);

-- Índices para otimização de busca
CREATE INDEX IF NOT EXISTS idx_agendamentos_horario ON agendamentos (horario) WHERE ativo = true;
CREATE INDEX IF NOT EXISTS idx_historico_comando ON historico_dosagens (comando_id);
CREATE INDEX IF NOT EXISTS idx_historico_data ON historico_dosagens (disparado_em DESC);

-- ========================================================
-- Seed Inicial compatível com o Frontend atual
-- ========================================================
INSERT INTO bombas (id, nome, solucao, cor, pino_gpio, vazao_ml_min, capacidade_recipiente_ml, volume_restante_ml)
VALUES 
    (1, 'Bomba 1', 'Solução A (Cálcio)', '#74e3d2', 5, 60.00, 1000.00, 950.00),
    (2, 'Bomba 2', 'Solução B (Alcalinidade)', '#94cfff', 4, 60.00, 1000.00, 950.00),
    (3, 'Bomba 3', 'Solução C (Magnésio)', '#c3b4fa', 14, 60.00, 1000.00, 950.00)
ON CONFLICT (id) DO NOTHING;

-- Agendamento inicial de teste para a Bomba 1 às 08:00
INSERT INTO agendamentos (bomba_id, volume_ml, horario, dias_semana)
VALUES (1, 5.00, '08:00:00', 'ALL')
ON CONFLICT DO NOTHING;

