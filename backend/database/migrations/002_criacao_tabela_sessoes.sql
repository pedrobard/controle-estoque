
CREATE TABLE public.sessoes (
    sid VARCHAR NOT NULL,
    sess JSON NOT NULL,
    expire TIMESTAMP(6) WITHOUT TIME ZONE NOT NULL,

    CONSTRAINT pk_sessoes PRIMARY KEY (sid)
);

CREATE INDEX idx_sessoes_expire
ON public.sessoes (expire);
