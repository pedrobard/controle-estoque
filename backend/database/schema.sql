
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);


-- =========================================
-- TABELA: CATEGORIAS
-- =========================================

CREATE TABLE public.categorias (
    id_categoria integer NOT NULL,
    nome character varying(100) NOT NULL,

    CONSTRAINT ck_categorias_nome
        CHECK (BTRIM(nome) <> '')
);

CREATE SEQUENCE public.categorias_id_categoria_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.categorias_id_categoria_seq
    OWNED BY public.categorias.id_categoria;

ALTER TABLE ONLY public.categorias
    ALTER COLUMN id_categoria
    SET DEFAULT nextval('public.categorias_id_categoria_seq'::regclass);

ALTER TABLE ONLY public.categorias
    ADD CONSTRAINT categorias_pkey
    PRIMARY KEY (id_categoria);

CREATE UNIQUE INDEX uq_categorias_nome_lower
    ON public.categorias USING btree (lower(BTRIM(nome)));


-- =========================================
-- TABELA: PRODUTOS
-- =========================================

CREATE TABLE public.produtos (
    id_produto integer NOT NULL,
    id_categoria integer NOT NULL,
    nome character varying(150) NOT NULL,
    quantidade numeric(12,3) DEFAULT 0 NOT NULL,
    custo_medio numeric(12,4) DEFAULT 0 NOT NULL,
    preco_venda_padrao numeric(12,2) NOT NULL,
    estoque_minimo numeric(12,3) DEFAULT 0 NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    excluido boolean DEFAULT false NOT NULL,

    CONSTRAINT ck_produtos_custo_medio
        CHECK (custo_medio >= 0),

    CONSTRAINT ck_produtos_estoque_minimo
        CHECK (estoque_minimo >= 0 AND estoque_minimo = TRUNC(estoque_minimo)),

    CONSTRAINT ck_produtos_nome
        CHECK (TRIM(BOTH FROM nome) <> ''),

    CONSTRAINT ck_produtos_preco_venda_padrao
        CHECK (preco_venda_padrao > 0),

    CONSTRAINT ck_produtos_quantidade
        CHECK (quantidade >= 0 AND quantidade = TRUNC(quantidade))
);

CREATE SEQUENCE public.produtos_id_produto_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.produtos_id_produto_seq
    OWNED BY public.produtos.id_produto;

ALTER TABLE ONLY public.produtos
    ALTER COLUMN id_produto
    SET DEFAULT nextval('public.produtos_id_produto_seq'::regclass);

ALTER TABLE ONLY public.produtos
    ADD CONSTRAINT produtos_pkey
    PRIMARY KEY (id_produto);

ALTER TABLE ONLY public.produtos
    ADD CONSTRAINT produtos_id_categoria_fkey
    FOREIGN KEY (id_categoria)
    REFERENCES public.categorias(id_categoria);


-- =========================================
-- TABELA: MOVIMENTACOES
-- =========================================

CREATE TABLE public.movimentacoes (
    id_movimentacao integer NOT NULL,
    id_produto integer NOT NULL,
    tipo character varying(20) NOT NULL,
    quantidade numeric(12,3) NOT NULL,
    custo_unitario numeric(12,4),
    preco_unitario_venda numeric(12,2),
    custo_total_movimentacao numeric(12,2),
    custo_medio_apos_movimentacao numeric(12,4) NOT NULL,
    valor_total_venda numeric(12,2),
    lucro_bruto_movimentacao numeric(12,2),
    quantidade_anterior numeric(12,3) NOT NULL,
    quantidade_final numeric(12,3) NOT NULL,
    diferenca numeric(12,3),
    motivo character varying(500),
    data_movimentacao timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    id_movimentacao_original integer,
    tipo_movimentacao_original character varying(20),
    estornada boolean DEFAULT false NOT NULL,

    CONSTRAINT ck_movimentacoes_custo_medio_apos_movimentacao
        CHECK (custo_medio_apos_movimentacao >= 0),

    CONSTRAINT ck_movimentacoes_custo_total_movimentacao
        CHECK (custo_total_movimentacao >= 0),

    CONSTRAINT ck_movimentacoes_custo_unitario
        CHECK (custo_unitario > 0),

    CONSTRAINT ck_movimentacoes_preco_unitario_venda
        CHECK (preco_unitario_venda > 0),

    CONSTRAINT ck_movimentacoes_quantidade
        CHECK (quantidade > 0 AND quantidade = TRUNC(quantidade)),

    CONSTRAINT ck_movimentacoes_quantidade_anterior
        CHECK (quantidade_anterior >= 0 AND quantidade_anterior = TRUNC(quantidade_anterior)),

    CONSTRAINT ck_movimentacoes_quantidade_final
        CHECK (quantidade_final >= 0 AND quantidade_final = TRUNC(quantidade_final)),

    CONSTRAINT ck_movimentacoes_tipo
        CHECK (tipo IN ('estoque inicial', 'entrada', 'saida', 'ajuste', 'estorno')),

    CONSTRAINT ck_movimentacoes_valor_total_venda
        CHECK (valor_total_venda >= 0),

    CONSTRAINT ck_movimentacoes_diferenca
        CHECK (diferenca IS NULL OR diferenca = TRUNC(diferenca))
);

CREATE SEQUENCE public.movimentacoes_id_movimentacao_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.movimentacoes_id_movimentacao_seq
    OWNED BY public.movimentacoes.id_movimentacao;

ALTER TABLE ONLY public.movimentacoes
    ALTER COLUMN id_movimentacao
    SET DEFAULT nextval('public.movimentacoes_id_movimentacao_seq'::regclass);

ALTER TABLE ONLY public.movimentacoes
    ADD CONSTRAINT movimentacoes_pkey
    PRIMARY KEY (id_movimentacao);

ALTER TABLE ONLY public.movimentacoes
    ADD CONSTRAINT movimentacoes_id_produto_fkey
    FOREIGN KEY (id_produto)
    REFERENCES public.produtos(id_produto);

ALTER TABLE ONLY public.movimentacoes
    ADD CONSTRAINT movimentacoes_id_movimentacao_original_fkey
    FOREIGN KEY (id_movimentacao_original)
    REFERENCES public.movimentacoes(id_movimentacao);

CREATE UNIQUE INDEX uq_movimentacoes_estorno_original
    ON public.movimentacoes USING btree (id_movimentacao_original)
    WHERE tipo = 'estorno';
