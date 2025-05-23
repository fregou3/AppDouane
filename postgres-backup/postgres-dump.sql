--
-- PostgreSQL database cluster dump
--

SET default_transaction_read_only = off;

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

--
-- Drop databases (except postgres and template1)
--

DROP DATABASE douane;




--
-- Drop roles
--

DROP ROLE postgres;


--
-- Roles
--

CREATE ROLE postgres;
ALTER ROLE postgres WITH SUPERUSER INHERIT CREATEROLE CREATEDB LOGIN REPLICATION BYPASSRLS PASSWORD 'SCRAM-SHA-256$4096:Y3ByVcQzzNVe3su4WkEzAg==$k+5a/Uu9gJ0xiSVgfzoBlwWWcb5Wn4+dIVnP6RhHfOU=:4zbnoLSkfKYnRkwJA96Vj7Beg0VdWsoQfk8Ypr9MTJQ=';

--
-- User Configurations
--








--
-- Databases
--

--
-- Database "template1" dump
--

--
-- PostgreSQL database dump
--

-- Dumped from database version 17.2 (Debian 17.2-1.pgdg120+1)
-- Dumped by pg_dump version 17.2 (Debian 17.2-1.pgdg120+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

UPDATE pg_catalog.pg_database SET datistemplate = false WHERE datname = 'template1';
DROP DATABASE template1;
--
-- Name: template1; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE template1 WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE template1 OWNER TO postgres;

\connect template1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: DATABASE template1; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON DATABASE template1 IS 'default template for new databases';


--
-- Name: template1; Type: DATABASE PROPERTIES; Schema: -; Owner: postgres
--

ALTER DATABASE template1 IS_TEMPLATE = true;


\connect template1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: DATABASE template1; Type: ACL; Schema: -; Owner: postgres
--

REVOKE CONNECT,TEMPORARY ON DATABASE template1 FROM PUBLIC;
GRANT CONNECT ON DATABASE template1 TO PUBLIC;


--
-- PostgreSQL database dump complete
--

--
-- Database "douane" dump
--

--
-- PostgreSQL database dump
--

-- Dumped from database version 17.2 (Debian 17.2-1.pgdg120+1)
-- Dumped by pg_dump version 17.2 (Debian 17.2-1.pgdg120+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: douane; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE douane WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE douane OWNER TO postgres;

\connect douane

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$


BEGIN


    NEW.updated_at = CURRENT_TIMESTAMP;


    RETURN NEW;


END;


$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: analyses_bon_livraison; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.analyses_bon_livraison (
    id integer NOT NULL,
    document_id integer,
    matiere_premiere_id integer,
    date_analyse timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    date_document boolean DEFAULT false,
    nom_fournisseur boolean DEFAULT false,
    nom_matiere_premiere boolean DEFAULT false,
    numero_bl boolean DEFAULT false,
    adresse_depart boolean DEFAULT false,
    adresse_destination boolean DEFAULT false,
    poids_colis boolean DEFAULT false,
    mode_transport boolean DEFAULT false,
    resume text,
    ratio_conformite numeric(5,2),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.analyses_bon_livraison OWNER TO postgres;

--
-- Name: analyses_bon_livraison_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.analyses_bon_livraison_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.analyses_bon_livraison_id_seq OWNER TO postgres;

--
-- Name: analyses_bon_livraison_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.analyses_bon_livraison_id_seq OWNED BY public.analyses_bon_livraison.id;


--
-- Name: analyses_bulletin_analyse; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.analyses_bulletin_analyse (
    id integer NOT NULL,
    document_id integer,
    matiere_premiere_id integer,
    date_analyse timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    date_document boolean DEFAULT false,
    nom_fournisseur boolean DEFAULT false,
    numero_lot boolean DEFAULT false,
    numero_commande boolean DEFAULT false,
    nom_matiere_premiere boolean DEFAULT false,
    caracteristiques_matiere boolean DEFAULT false,
    resume text,
    ratio_conformite numeric(5,2),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.analyses_bulletin_analyse OWNER TO postgres;

--
-- Name: analyses_bulletin_analyse_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.analyses_bulletin_analyse_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.analyses_bulletin_analyse_id_seq OWNER TO postgres;

--
-- Name: analyses_bulletin_analyse_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.analyses_bulletin_analyse_id_seq OWNED BY public.analyses_bulletin_analyse.id;


--
-- Name: documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents (
    id integer NOT NULL,
    matiere_premiere_id integer,
    transformation_id integer,
    type_document character varying(50),
    fichier_path character varying(255),
    status character varying(20) DEFAULT 'en_attente'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    semi_fini_id integer,
    produit_fini_id integer,
    CONSTRAINT check_one_reference CHECK (((((
CASE
    WHEN (matiere_premiere_id IS NOT NULL) THEN 1
    ELSE 0
END +
CASE
    WHEN (transformation_id IS NOT NULL) THEN 1
    ELSE 0
END) +
CASE
    WHEN (semi_fini_id IS NOT NULL) THEN 1
    ELSE 0
END) +
CASE
    WHEN (produit_fini_id IS NOT NULL) THEN 1
    ELSE 0
END) = 1)),
    CONSTRAINT documents_status_check CHECK (((status)::text = ANY (ARRAY[('en_attente'::character varying)::text, ('valide'::character varying)::text, ('rejete'::character varying)::text]))),
    CONSTRAINT documents_type_document_check CHECK (((type_document)::text = ANY (ARRAY[('bon_livraison'::character varying)::text, ('bulletin_analyse'::character varying)::text, ('certificat'::character varying)::text, ('controle_qualite'::character varying)::text, ('certificat_transformation'::character varying)::text, ('certificat_conformite'::character varying)::text, ('certificat_origine'::character varying)::text, ('facture'::character varying)::text, ('certificat_phytosanitaire'::character varying)::text, ('fiche_technique'::character varying)::text, ('bon_fabrication'::character varying)::text, ('declaration_douaniere'::character varying)::text])))
);


ALTER TABLE public.documents OWNER TO postgres;

--
-- Name: documents_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.documents_id_seq OWNER TO postgres;

--
-- Name: documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.documents_id_seq OWNED BY public.documents.id;


--
-- Name: documents_requis; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents_requis (
    id integer NOT NULL,
    type_element character varying(50) NOT NULL,
    type_document character varying(100) NOT NULL
);


ALTER TABLE public.documents_requis OWNER TO postgres;

--
-- Name: documents_requis_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.documents_requis_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.documents_requis_id_seq OWNER TO postgres;

--
-- Name: documents_requis_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.documents_requis_id_seq OWNED BY public.documents_requis.id;


--
-- Name: fournisseurs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fournisseurs (
    id integer NOT NULL,
    nom character varying(255) NOT NULL,
    adresse text,
    pays character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.fournisseurs OWNER TO postgres;

--
-- Name: fournisseurs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.fournisseurs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.fournisseurs_id_seq OWNER TO postgres;

--
-- Name: fournisseurs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.fournisseurs_id_seq OWNED BY public.fournisseurs.id;


--
-- Name: matieres_premieres; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.matieres_premieres (
    id integer NOT NULL,
    nom character varying(255) NOT NULL,
    type character varying(50),
    lot character varying(100) NOT NULL,
    fournisseur_id integer,
    pays_origine character varying(100),
    valeur numeric(10,2),
    code_douanier character varying(50),
    matiere_premiere_source character varying(255),
    regle_origine text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    code_douanier_gpt text,
    CONSTRAINT matieres_premieres_type_check CHECK (((type)::text = ANY (ARRAY[('metal'::character varying)::text, ('plastic'::character varying)::text, ('plante'::character varying)::text, ('extrait'::character varying)::text, ('carton'::character varying)::text, ('verre'::character varying)::text, ('tissu'::character varying)::text])))
);


ALTER TABLE public.matieres_premieres OWNER TO postgres;

--
-- Name: matieres_premieres_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.matieres_premieres_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.matieres_premieres_id_seq OWNER TO postgres;

--
-- Name: matieres_premieres_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.matieres_premieres_id_seq OWNED BY public.matieres_premieres.id;


--
-- Name: matieres_transformations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.matieres_transformations (
    id integer NOT NULL,
    matiere_premiere_id integer,
    transformation_id integer
);


ALTER TABLE public.matieres_transformations OWNER TO postgres;

--
-- Name: matieres_transformations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.matieres_transformations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.matieres_transformations_id_seq OWNER TO postgres;

--
-- Name: matieres_transformations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.matieres_transformations_id_seq OWNED BY public.matieres_transformations.id;


--
-- Name: produits_finis; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.produits_finis (
    id integer NOT NULL,
    nom character varying(255) NOT NULL,
    origine character varying(255),
    valeur numeric,
    code_douanier character varying(255),
    semi_fini_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    sauce_id integer,
    pays_origine character varying(100),
    lot_number character varying(100)
);


ALTER TABLE public.produits_finis OWNER TO postgres;

--
-- Name: produits_finis_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.produits_finis_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.produits_finis_id_seq OWNER TO postgres;

--
-- Name: produits_finis_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.produits_finis_id_seq OWNED BY public.produits_finis.id;


--
-- Name: resultats_bon_livraison; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.resultats_bon_livraison (
    id integer NOT NULL,
    analyse_id integer,
    document_id integer,
    critere character varying(100) NOT NULL,
    valeur_attendue text,
    valeur_trouvee text,
    est_conforme boolean,
    commentaire text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.resultats_bon_livraison OWNER TO postgres;

--
-- Name: resultats_bon_livraison_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.resultats_bon_livraison_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.resultats_bon_livraison_id_seq OWNER TO postgres;

--
-- Name: resultats_bon_livraison_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.resultats_bon_livraison_id_seq OWNED BY public.resultats_bon_livraison.id;


--
-- Name: resultats_bulletin_analyse; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.resultats_bulletin_analyse (
    id integer NOT NULL,
    analyse_id integer,
    document_id integer,
    specification character varying(100) NOT NULL,
    valeur_attendue text,
    valeur_trouvee text,
    est_conforme boolean,
    commentaire text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.resultats_bulletin_analyse OWNER TO postgres;

--
-- Name: resultats_bulletin_analyse_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.resultats_bulletin_analyse_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.resultats_bulletin_analyse_id_seq OWNER TO postgres;

--
-- Name: resultats_bulletin_analyse_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.resultats_bulletin_analyse_id_seq OWNED BY public.resultats_bulletin_analyse.id;


--
-- Name: semi_finis; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.semi_finis (
    id integer NOT NULL,
    nom character varying(255) NOT NULL,
    lot_number character varying(255),
    pays_origine character varying(100),
    valeur numeric(10,2),
    code_douanier character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.semi_finis OWNER TO postgres;

--
-- Name: semi_finis_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.semi_finis_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.semi_finis_id_seq OWNER TO postgres;

--
-- Name: semi_finis_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.semi_finis_id_seq OWNED BY public.semi_finis.id;


--
-- Name: semi_finis_matieres_premieres; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.semi_finis_matieres_premieres (
    semi_fini_id integer NOT NULL,
    matiere_premiere_id integer NOT NULL
);


ALTER TABLE public.semi_finis_matieres_premieres OWNER TO postgres;

--
-- Name: semi_finis_transformations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.semi_finis_transformations (
    semi_fini_id integer NOT NULL,
    transformation_id integer NOT NULL
);


ALTER TABLE public.semi_finis_transformations OWNER TO postgres;

--
-- Name: transformations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transformations (
    id integer NOT NULL,
    nom character varying(255) NOT NULL,
    fournisseur_id integer,
    lot character varying(100) NOT NULL,
    origine character varying(100),
    valeur numeric(10,2),
    code_douanier character varying(50),
    description text,
    matiere_premiere_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    code_douanier_gpt text
);


ALTER TABLE public.transformations OWNER TO postgres;

--
-- Name: transformations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.transformations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.transformations_id_seq OWNER TO postgres;

--
-- Name: transformations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.transformations_id_seq OWNED BY public.transformations.id;


--
-- Name: vue_transformations; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vue_transformations AS
 SELECT t.id,
    t.nom,
    f.nom AS fournisseur,
    t.lot,
    t.origine,
    t.valeur,
    t.code_douanier,
    t.description,
    t.matiere_premiere_id,
    t.created_at,
    t.updated_at
   FROM (public.transformations t
     JOIN public.fournisseurs f ON ((t.fournisseur_id = f.id)));


ALTER VIEW public.vue_transformations OWNER TO postgres;

--
-- Name: analyses_bon_livraison id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.analyses_bon_livraison ALTER COLUMN id SET DEFAULT nextval('public.analyses_bon_livraison_id_seq'::regclass);


--
-- Name: analyses_bulletin_analyse id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.analyses_bulletin_analyse ALTER COLUMN id SET DEFAULT nextval('public.analyses_bulletin_analyse_id_seq'::regclass);


--
-- Name: documents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents ALTER COLUMN id SET DEFAULT nextval('public.documents_id_seq'::regclass);


--
-- Name: documents_requis id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents_requis ALTER COLUMN id SET DEFAULT nextval('public.documents_requis_id_seq'::regclass);


--
-- Name: fournisseurs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fournisseurs ALTER COLUMN id SET DEFAULT nextval('public.fournisseurs_id_seq'::regclass);


--
-- Name: matieres_premieres id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.matieres_premieres ALTER COLUMN id SET DEFAULT nextval('public.matieres_premieres_id_seq'::regclass);


--
-- Name: matieres_transformations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.matieres_transformations ALTER COLUMN id SET DEFAULT nextval('public.matieres_transformations_id_seq'::regclass);


--
-- Name: produits_finis id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.produits_finis ALTER COLUMN id SET DEFAULT nextval('public.produits_finis_id_seq'::regclass);


--
-- Name: resultats_bon_livraison id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resultats_bon_livraison ALTER COLUMN id SET DEFAULT nextval('public.resultats_bon_livraison_id_seq'::regclass);


--
-- Name: resultats_bulletin_analyse id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resultats_bulletin_analyse ALTER COLUMN id SET DEFAULT nextval('public.resultats_bulletin_analyse_id_seq'::regclass);


--
-- Name: semi_finis id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.semi_finis ALTER COLUMN id SET DEFAULT nextval('public.semi_finis_id_seq'::regclass);


--
-- Name: transformations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transformations ALTER COLUMN id SET DEFAULT nextval('public.transformations_id_seq'::regclass);


--
-- Data for Name: analyses_bon_livraison; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.analyses_bon_livraison (id, document_id, matiere_premiere_id, date_analyse, date_document, nom_fournisseur, nom_matiere_premiere, numero_bl, adresse_depart, adresse_destination, poids_colis, mode_transport, resume, ratio_conformite, created_at, updated_at) FROM stdin;
2	12	\N	2024-12-29 16:10:55.693485	t	t	t	t	t	t	t	t	Document conforme ?? toutes les exigences. Tous les champs obligatoires sont pr??sents et correctement remplis.	1.00	2024-12-29 16:10:55.693485	2024-12-29 16:10:55.693485
3	16	\N	2024-12-29 16:17:14.169505	t	t	t	t	t	t	t	t	Document conforme ?? toutes les exigences. Tous les champs obligatoires sont pr??sents et correctement remplis.	1.00	2024-12-29 16:17:14.169505	2024-12-29 16:17:14.169505
4	15	\N	2024-12-29 16:17:14.169505	t	t	t	t	f	t	t	t	Document globalement conforme. L'adresse de d??part est manquante.	0.88	2024-12-29 16:17:14.169505	2024-12-29 16:17:14.169505
5	13	\N	2024-12-29 16:17:14.169505	t	t	t	t	t	t	f	t	Document globalement conforme. Le poids des colis n'est pas sp??cifi??.	0.88	2024-12-29 16:17:14.169505	2024-12-29 16:17:14.169505
1	7	\N	2024-12-29 18:30:39.795068	f	t	t	t	t	t	t	f	[Le document fourni est un bon de livraison qui comprend toutes les informations mentionn??es pour l'analyse. Il a ??t?? d??livr?? le 01.03.2024 et porte le num??ro 80337620. Le fournisseur est LAMBERT & VALETTE - GROUPE HEPPNER, et la mati??re premi??re fournie est GATULINE LINK N LIFT. Le document donne les adresses de d??part et de destination, ainsi que le poids du colis de 496,850 KG. Le mode de transport est par route.]	0.75	2024-12-29 16:01:58.132237	2024-12-29 18:30:39.795068
\.


--
-- Data for Name: analyses_bulletin_analyse; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.analyses_bulletin_analyse (id, document_id, matiere_premiere_id, date_analyse, date_document, nom_fournisseur, numero_lot, numero_commande, nom_matiere_premiere, caracteristiques_matiere, resume, ratio_conformite, created_at, updated_at) FROM stdin;
2	11	\N	2024-12-29 16:10:55.697794	t	t	t	f	t	t	Document globalement conforme. Le num??ro de commande est manquant mais tous les autres champs sont pr??sents.	0.85	2024-12-29 16:10:55.697794	2024-12-29 16:10:55.697794
3	17	\N	2024-12-29 16:17:14.173768	t	t	t	t	t	t	Document conforme ?? toutes les exigences. Tous les champs obligatoires sont pr??sents et correctement remplis.	1.00	2024-12-29 16:17:14.173768	2024-12-29 16:17:14.173768
4	14	\N	2024-12-29 16:17:14.173768	t	t	t	f	t	t	Document globalement conforme. Le num??ro de commande est manquant.	0.83	2024-12-29 16:17:14.173768	2024-12-29 16:17:14.173768
5	16	\N	2024-12-29 17:47:18.678696	f	f	f	f	f	f		NaN	2024-12-29 17:47:18.678696	2024-12-29 17:47:18.678696
1	7	\N	2024-12-29 18:30:50.710354	f	t	t	t	t	f	Le document donn?? est un bulletin d'analyse dat?? du 19/11/2019. Il a ??t?? fourni par Jean GAZIGNAIRE S.A.S. Il fournit des informations sur l'huile essentielle de citron biologique, qui est not??e comme une mati??re premi??re aromatique biologique. Le num??ro de lot est 1-23-108 et le num??ro de commande est 461390. Le document comprend ??galement des d??tails sur les caract??ristiques organoleptiques et physico-chimiques de la mati??re premi??re.	0.67	2024-12-29 16:05:24.109868	2024-12-29 18:30:50.710354
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documents (id, matiere_premiere_id, transformation_id, type_document, fichier_path, status, created_at, updated_at, semi_fini_id, produit_fini_id) FROM stdin;
1	1	\N	bon_livraison	/path/to/bl_lavande_dist.pdf	en_attente	2024-12-29 10:55:38.903599	2024-12-29 15:47:43.936151	\N	\N
2	1	\N	bulletin_analyse	/path/to/ba_lavande_rect.pdf	en_attente	2024-12-29 10:55:38.903599	2024-12-29 15:47:43.936151	\N	\N
3	1	\N	bon_livraison	/path/to/bl_lavande_filt.pdf	en_attente	2024-12-29 10:55:38.903599	2024-12-29 15:47:43.936151	\N	\N
4	2	\N	bon_livraison	/path/to/bl_calendula_mac.pdf	en_attente	2024-12-29 10:55:38.903599	2024-12-29 15:47:43.936151	\N	\N
5	2	\N	bulletin_analyse	/path/to/ba_calendula_filt.pdf	en_attente	2024-12-29 10:55:38.903599	2024-12-29 15:47:43.936151	\N	\N
6	2	\N	bon_livraison	/path/to/bl_calendula_conc.pdf	en_attente	2024-12-29 10:55:38.903599	2024-12-29 15:47:43.936151	\N	\N
7	3	\N	bon_livraison	/path/to/bl_ah_ferm.pdf	en_attente	2024-12-29 10:55:38.903599	2024-12-29 15:47:43.936151	\N	\N
8	3	\N	bulletin_analyse	/path/to/ba_ah_pur.pdf	en_attente	2024-12-29 10:55:38.903599	2024-12-29 15:47:43.936151	\N	\N
9	3	\N	bon_livraison	/path/to/bl_ah_lyo.pdf	en_attente	2024-12-29 10:55:38.903599	2024-12-29 15:47:43.936151	\N	\N
10	4	\N	bon_livraison	/path/to/bl_parfum_ext.pdf	en_attente	2024-12-29 10:55:38.903599	2024-12-29 15:47:43.936151	\N	\N
11	4	\N	bulletin_analyse	/path/to/ba_parfum_dist.pdf	en_attente	2024-12-29 10:55:38.903599	2024-12-29 15:47:43.936151	\N	\N
12	4	\N	bon_livraison	/path/to/bl_parfum_form.pdf	en_attente	2024-12-29 10:55:38.903599	2024-12-29 15:47:43.936151	\N	\N
13	5	\N	bon_livraison	/path/to/bl_cosgard_syn.pdf	en_attente	2024-12-29 10:55:38.903599	2024-12-29 15:47:43.936151	\N	\N
14	5	\N	bulletin_analyse	/path/to/ba_cosgard_pur.pdf	en_attente	2024-12-29 10:55:38.903599	2024-12-29 15:47:43.936151	\N	\N
15	5	\N	bon_livraison	/path/to/bl_cosgard_std.pdf	en_attente	2024-12-29 10:55:38.903599	2024-12-29 15:47:43.936151	\N	\N
16	7	\N	bon_livraison	uploads/1735547595991-BL 31300.pdf	valide	2024-12-29 15:31:24.656293	2024-12-30 08:33:16.048258	\N	\N
17	7	\N	bulletin_analyse	uploads/1735547606113-BA Huile essentielle de citron bio G108223 - lot 1-23-108-032 - Clarins.pdf	valide	2024-12-29 15:31:36.97764	2024-12-30 08:33:26.138295	\N	\N
\.


--
-- Data for Name: documents_requis; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documents_requis (id, type_element, type_document) FROM stdin;
16	plante	bon_livraison
17	plante	bulletin_analyse
18	plante	certificat
19	extrait	bon_livraison
20	extrait	bulletin_analyse
21	extrait	certificat
22	sauce	bon_livraison
23	sauce	bulletin_analyse
24	sauce	certificat
25	produit	bon_livraison
26	produit	bulletin_analyse
27	produit	certificat
\.


--
-- Data for Name: fournisseurs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fournisseurs (id, nom, adresse, pays, created_at, updated_at) FROM stdin;
1	Aroma-Zone	42 Avenue Wagram, 75008 Paris	France	2024-12-29 10:55:38.894416	2024-12-29 10:55:38.894416
2	Botanica	Hauptstra??e 25, 10178 Berlin	Allemagne	2024-12-29 10:55:38.894416	2024-12-29 10:55:38.894416
3	Making Cosmetics	15 Rue du Commerce, 75015 Paris	France	2024-12-29 10:55:38.894416	2024-12-29 10:55:38.894416
4	Cr??ation & Parfum	8 Avenue des Champs-??lys??es, 75008 Paris	France	2024-12-29 10:55:38.894416	2024-12-29 10:55:38.894416
5	F01	\N	\N	2024-12-29 11:02:09.799048	2024-12-29 11:02:09.799048
6	F02	\N	\N	2024-12-29 21:12:21.208358	2024-12-29 21:12:21.208358
7	FR02	\N	\N	2024-12-29 21:12:56.825337	2024-12-29 21:12:56.825337
8	F03	\N	\N	2024-12-29 21:25:53.518787	2024-12-29 21:25:53.518787
9		\N	\N	2025-01-02 15:37:56.242282	2025-01-02 15:37:56.242282
10	Cr├®ation & Parfum	\N	\N	2025-01-02 17:11:45.735776	2025-01-02 17:11:45.735776
11	Gilbon	\N	\N	2025-01-02 17:43:31.061762	2025-01-02 17:43:31.061762
12	Four	\N	\N	2025-01-09 15:03:03.110077	2025-01-09 15:03:03.110077
13	four	\N	\N	2025-01-09 15:13:52.49423	2025-01-09 15:13:52.49423
14	SHANGHAI RADIALL Electronic Co., Ltd	\N	\N	2025-03-24 13:56:57.708088	2025-03-24 13:56:57.708088
15	Eclat Naturel	\N	\N	2025-03-24 20:49:13.48754	2025-03-24 20:49:13.48754
16	Lunessence Botanique	\N	\N	2025-03-24 20:49:39.783193	2025-03-24 20:49:39.783193
17	Fourn 1	\N	\N	2025-03-24 21:10:03.912982	2025-03-24 21:10:03.912982
18	ABC Textiles	\N	\N	2025-03-24 21:49:18.50598	2025-03-24 21:49:18.50598
19	FromageFin	\N	\N	2025-04-06 21:09:26.563624	2025-04-06 21:09:26.563624
\.


--
-- Data for Name: matieres_premieres; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.matieres_premieres (id, nom, type, lot, fournisseur_id, pays_origine, valeur, code_douanier, matiere_premiere_source, regle_origine, created_at, updated_at, code_douanier_gpt) FROM stdin;
5	Cosgard	extrait	COS2024005	1	France	178.90	3307.49	Synth├¿se chimique	Origine UE	2024-12-29 10:55:38.895973	2025-01-02 12:27:39.182091	3307.49\n\nLe code douanier 3307.49 correspond aux "pr├®parations pour l'hygi├¿ne buccale ou dentaire, y compris les poudres et les cr├¿mes pour le nettoyage des dents". Dans ce cas, le Cosgard, en tant qu'agent conservateur utilis├® dans les produits cosm├®tiques et d'hygi├¿ne personnelle, pourrait ├¬tre class├® sous ce code douanier en raison de son utilisation potentielle dans des produits d'hygi├¿ne bucco-dentaire.\n\nDes alternatives possibles pourraient inclure:\n- 2909.49: Autres ├®thers alcooliques\n- 2909.49: Autres compos├®s cycliques\n- 2918.15: Autres compos├®s carbonyl├®s\nIl est recommand├® de v├®rifier sp├®cifiquement la composition exacte du Cosgard pour d├®terminer avec pr├®cision le code douanier le plus appropri├®.
8	Gentiane	plante	P002	6	France	234.00	1211.90			2024-12-29 21:12:21.215862	2025-01-02 17:11:10.622676	1211.90\n\nLa gentiane est une plante utilis├®e dans la fabrication de divers produits, notamment des liqueurs et des m├®dicaments. Le code douanier 1211.90 est r├®serv├® aux plantes et parties de plantes non comestibles, ce qui correspond bien ├á la gentiane. Il s'agit d'une plante ├á usage m├®dicinal ou pour la fabrication de produits pharmaceutiques. \n\nAlternatives possibles:\n- 1211.20 : Plantes et parties de plantes utilis├®es principalement dans l'industrie de la parfumerie, de la pharmacie ou ├á des fins insecticides, fongicides ou similaires.\n- 1211.30 : Plantes et parties de plantes utilis├®es principalement dans la teinture ou l'impression.\nCes alternatives pourraient ├®galement convenir en fonction de l'utilisation sp├®cifique de la gentiane.
9	Huile Gentiane	extrait	MP002	7	France	23.00	3301.29	P002		2024-12-29 21:12:56.827744	2025-01-02 17:11:16.179541	3301.29\n\nL'huile de gentiane est une substance v├®g├®tale utilis├®e dans diverses industries, y compris l'industrie cosm├®tique et pharmaceutique. Le code douanier 3301.29 est sp├®cifique pour les huiles essentielles et r├®sino├»des d'autres plantes aromatiques. La gentiane ├®tant une plante aromatique, ce code douanier est le plus appropri├® pour l'huile de gentiane.\n\nAlternatives possibles:\n- 1302.19 (extrait v├®g├®tal utilis├® en pharmacie, m├®decine, etc.)\n- 3301.29.90 (autres huiles essentielles et r├®sino├»des)
10	Verveine	plante	P003	8	France	122.99	0602.90			2024-12-29 21:25:53.522222	2025-01-02 17:11:22.647194	0602.90\n\nLes plantes en g├®n├®ral sont class├®es sous le code douanier 0602.90 dans le Syst├¿me Harmonis├®. La verveine, en tant que plante, serait donc class├®e sous ce code. Ce code couvre les plantes vivantes et les bulbes, les rhizomes, les boutures, les greffons et les graines pour la plantation. Il est important de noter que ce code est une cat├®gorie g├®n├®rale et que des codes douaniers plus sp├®cifiques pourraient ├¬tre utilis├®s en fonction de la forme sous laquelle la verveine est import├®e/export├®e (par exemple, s├®ch├®e, en poudre, en extrait, etc.).
4	Parfum rose	extrait	PRF2024004	10	France	432.60	3303.00	Synth├¿se	Origine UE	2024-12-29 10:55:38.895973	2025-01-02 17:43:09.550016	3303.00\n\nLes parfums sont class├®s sous le code douanier 3303.00, qui concerne les pr├®parations pour l'entretien ou la toilette de la peau. Dans ce cas, le parfum en question est une pr├®paration ├á base de rose, avec un type d'extrait. M├¬me s'il est produit de mani├¿re synth├®tique, cela n'affecte pas le code douanier, car il est bas├® sur l'utilisation du produit (parfum) et non sur sa source (naturelle ou synth├®tique). Il n'est donc pas n├®cessaire de sp├®cifier la source (synth├¿se) pour d├®terminer le code douanier appropri├®.\n\nDes alternatives pourraient inclure :\n- 3303.00.10 pour les pr├®parations ├á base d'essences odorantes naturelles\n- 3303.00.90 pour les autres pr├®parations parfum├®es
11	Huile Verveine	extrait	MP003	8	Allemagne	234.00	3301.29	P003	Origine UE	2024-12-29 21:26:20.726544	2025-01-02 17:42:46.29208	3301.29\n\nL'huile de verveine est g├®n├®ralement class├®e sous le code douanier 3301.29, qui concerne les huiles essentielles et r├®sino├»des; produits de parfumerie ou de toilette pr├®par├®s. Ce code est appropri├® car il englobe les huiles essentielles extraites de plantes aromatiques, y compris l'huile de verveine. \n\nD'autres codes douaniers possibles pourraient ├¬tre: \n- 3301.24 : Huiles essentielles d'agrumes, y compris la verveine citronn├®e.\n- 3301.29.90 : Autres huiles essentielles, si la verveine n'est pas sp├®cifiquement mentionn├®e dans les codes plus d├®taill├®s. \n\nCependant, le code principal 3301.29 est le plus appropri├® pour l'huile de verveine en raison de sa nature d'huile essentielle extraite.
6	Melisse	plante	P0001	11	France	342.00	1211.90			2024-12-29 11:02:09.801126	2025-01-02 17:43:31.067219	1211.90\n\nLa m├®lisse est une plante aromatique largement utilis├®e en cuisine et en herboristerie pour ses propri├®t├®s m├®dicinales. Le code douanier le plus appropri├® pour la m├®lisse en tant que plante est 1211.90, qui correspond aux "Plantes et parties de plantes (y compris les graines et fruits), de nature ├á ├¬tre utilis├®es principalement comme mati├¿res premi├¿res pour l'alimentation, non d├®nomm├®es ni comprises ailleurs".\n\nDes alternatives possibles pourraient inclure:\n- 1211.90.90 : Autres\n- 1211.90.10 : Plantes aromatiques\n\nCependant, le code principal 1211.90 reste le plus appropri├® pour la m├®lisse en tant que plante.
2	Extrait de calendula	extrait	CAL2024002	2	Allemagne	289.50	1302.14	Fleurs de Calendula Bio	Origine UE	2024-12-29 10:55:38.895973	2025-01-02 12:27:39.182091	1302.19\n\nLes extraits de calendula sont g├®n├®ralement class├®s sous le code douanier 1302.19, qui couvre les extraits v├®g├®taux ├á base d'autres plantes, fleurs ou fruits, autres que les algues. Le calendula, ├®galement connu sous le nom de souci officinal, est une plante utilis├®e pour ses propri├®t├®s apaisantes et anti-inflammatoires, ce qui le rend populaire dans les produits de soins de la peau et les produits pharmaceutiques.\n\nDes alternatives possibles pourraient inclure :\n- 1302.14 : pour les extraits de fleurs d'autres types de plantes\n- 1302.19.90 : pour les extraits v├®g├®taux non sp├®cifi├®s ailleurs
1	Huile essentielle de lavande	extrait	LAV2024001	1	France	345.00	3301.24	Lavande fine de Provence	Origine UE	2024-12-29 10:55:38.895973	2025-02-07 14:45:21.847831	3301.29\n\nL'huile essentielle de lavande extraite de la lavande fine de Provence est class├®e sous le code douanier 3301.29. Ce code correspond aux huiles essentielles d'agrumes, d'aspic, de lavande, de lavandin, de m├®lisse, de menthe, de romarin et de thym. La lavande fine de Provence est une vari├®t├® sp├®cifique de lavande largement reconnue pour sa qualit├® et son parfum. \n\nDes codes douaniers alternatifs possibles pourraient inclure :\n- 3301.24 : Huiles essentielles de menthe\n- 3301.25 : Huiles essentielles de citron\n- 3301.26 : Huiles essentielles d'orange\n- 3301.29 : Autres huiles essentielles, y compris de lavande\n\nIl est recommand├® de v├®rifier la classification sp├®cifique avec les autorit├®s douani├¿res comp├®tentes pour garantir une classification exacte.
3	Acide hyaluronique	extrait	AH2024003	3	France	567.80	3002.10	Fermentation bact├®rienne	Origine UE	2024-12-29 10:55:38.895973	2025-01-02 17:10:41.105972	3913.90\n\nL'acide hyaluronique est un polysaccharide naturel pr├®sent dans le corps humain et largement utilis├® en cosm├®tique pour ses propri├®t├®s hydratantes et anti-├óge. Le code douanier 3913.90 est sp├®cifique pour "autres polysaccharides" non sp├®cifi├®s ailleurs, ce qui inclut l'acide hyaluronique extrait par fermentation bact├®rienne.\n\nAlternative possible:\n- 3002.10 : Sang humain, acide hyaluronique obtenu ├á partir de sources animales.
7	Huile Melisse	extrait	MP001	5	France	23.00	3301.29	P0001		2024-12-29 11:02:41.272186	2025-01-02 17:11:04.711551	3301.29\n\nL'huile de m├®lisse est une substance extraite de la plante de m├®lisse. Le code douanier 3301.29 est utilis├® pour les huiles essentielles et r├®sino├»des obtenues par distillation et extraction, autres que celles de l'orange am├¿re. Dans ce cas, l'huile de m├®lisse correspond ├á une huile extraite d'une plante sp├®cifique, ce qui la classe dans cette cat├®gorie.\n\nAlternatives possibles:\n- 3301.24 : Les huiles essentielles obtenues par extraction des agrumes, y compris l'orange am├¿re. Cependant, ├®tant donn├® que dans ce cas il s'agit d'huile de m├®lisse et non d'agrumes, ce code n'est pas le plus appropri├®.\n- 3301.29.90 : Autres huiles essentielles. Ce code pourrait ├¬tre utilis├® de mani├¿re plus g├®n├®rale si la description exacte de l'huile n'est pas disponible.
15	Cuir	metal		9		77.00	4203.00			2025-01-27 09:36:31.443683	2025-01-27 09:36:35.623485	4203.00\n\nLe code douanier appropri├® pour le cuir de type m├®tal est le 4203.00. Ce code concerne les articles en cuir compos├®s de cuir v├®ritable ou reconstitu├®, enduits ou recouverts d'une fine couche de m├®tal pour leur donner un aspect m├®tallique. Ce code est sp├®cifique pour les articles en cuir m├®tallis├®.\n\nDes alternatives possibles pourraient inclure:\n- 4205.00 : Articles en cuir reconstitu├®, enduits ou recouverts de mat├®riaux autres que le m├®tal\n- 4202.22 : Peaux et cuirs de bovins, pr├®par├®s apr├¿s tannage "au chrome", teints, d'une superficie sup├®rieure ├á 2,6 m┬▓ mais ne d├®passant pas 28 m┬▓\nCependant, ces codes ne seraient pas aussi pr├®cis que le 4203.00 pour d├®signer sp├®cifiquement le cuir de type m├®tal.
20	Cristaux de S├®liane	metal	3334	16	France	4.33	33049900	\N	\N	2025-03-24 20:49:39.837295	2025-03-24 20:49:39.837295	\N
22	Bracelet m├®tal argent	metal	122213	\N	France	234.00	71171900			2025-03-24 21:07:36.716604	2025-03-24 21:10:18.23131	7117.19\n\nLes bracelets en m├®tal argent├® sont g├®n├®ralement class├®s sous le code douanier 7117.19. Ce code concerne les bijoux et ouvrages similaires en m├®taux communs plaqu├®s ou doubl├®s d'argent. Le sous-type "metal" sp├®cifie que le mat├®riau principal du bracelet est le m├®tal, en l'occurrence de l'argent. \n\nAlternativement, si le bracelet ├®tait en argent massif sans plaquage, le code douanier appropri├® serait 7113.19, qui concerne les bijoux en argent massif.
23	Bracelet or	metal	121231	17	France	1234.00	71131900			2025-03-24 21:10:03.966454	2025-03-24 21:10:19.612079	7113.19\n\nLes bracelets en or sont g├®n├®ralement class├®s sous le code douanier 7113.19, qui correspond aux "autres bijoux en m├®taux pr├®cieux ou plaqu├®s ou doubl├®s d'une couche de m├®tals pr├®cieux". Dans ce cas, le bracelet en question ├®tant en or, ce code serait le plus appropri├®.\n\nDes alternatives possibles pourraient inclure :\n- 7113.11 pour les bracelets en or massif\n- 7113.20 pour les bracelets en m├®taux pr├®cieux autres que l'or
33	125mm pad for DA sander 5/16-unf GRIP	extrait		\N		419.01	84679900			2025-03-24 22:05:19.882982	2025-03-24 22:05:19.882982	\N
\.


--
-- Data for Name: matieres_transformations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.matieres_transformations (id, matiere_premiere_id, transformation_id) FROM stdin;
\.


--
-- Data for Name: produits_finis; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.produits_finis (id, nom, origine, valeur, code_douanier, semi_fini_id, created_at, updated_at, sauce_id, pays_origine, lot_number) FROM stdin;
4	DS9	\N	343	33049900	\N	2024-12-29 10:44:35.149174	2025-01-02 17:13:22.390445	1	Suisse	0899829
\.


--
-- Data for Name: resultats_bon_livraison; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.resultats_bon_livraison (id, analyse_id, document_id, critere, valeur_attendue, valeur_trouvee, est_conforme, commentaire, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: resultats_bulletin_analyse; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.resultats_bulletin_analyse (id, analyse_id, document_id, specification, valeur_attendue, valeur_trouvee, est_conforme, commentaire, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: semi_finis; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.semi_finis (id, nom, lot_number, pays_origine, valeur, code_douanier, created_at, updated_at) FROM stdin;
1	Sauce 4	S37	France	246.00	3304.20	2024-12-29 10:56:48.939628	2025-01-02 17:12:18.143032
\.


--
-- Data for Name: semi_finis_matieres_premieres; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.semi_finis_matieres_premieres (semi_fini_id, matiere_premiere_id) FROM stdin;
1	9
1	11
1	7
\.


--
-- Data for Name: semi_finis_transformations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.semi_finis_transformations (semi_fini_id, transformation_id) FROM stdin;
\.


--
-- Data for Name: transformations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transformations (id, nom, fournisseur_id, lot, origine, valeur, code_douanier, description, matiere_premiere_id, created_at, updated_at, code_douanier_gpt) FROM stdin;
2	Rectification	1	RECT-LAV001	Italie	180.00	3301.90	Purification par rectification de l'huile essentielle	1	2024-12-29 10:55:38.89961	2025-01-02 12:24:24.860098	3301.29\n\nL'huile essentielle de lavande est une substance d'origine v├®g├®tale (plante) et provient de l'Italie. La rectification est un processus de purification visant ├á am├®liorer la qualit├® de l'huile essentielle en ├®liminant les impuret├®s et en standardisant sa composition chimique. Le code douanier 3301.29 correspond aux huiles essentielles d'agrumes, d'eucalyptus, de g├®ranium, de jasmin, de lavande, de menthe, de patchouli, de pin, de bois de rose, de santal, de thuya et d'ylang-ylang, ainsi qu'├á la rectification de ces huiles. Il est donc le plus appropri├® pour cette transformation. \n\nAlternatives possibles:\n- 3301.24 pour les autres huiles essentielles, r├®sino├»des et m├®langes contenant des huiles essentielles\n- 3301.90 pour les autres huiles essentielles et r├®sino├»des, non d├®nomm├®es ni comprises
5	Filtration	2	FILT-CAL001	Autriche	90.00	8421.39	Filtration de l'extrait de calendula	2	2024-12-29 10:55:38.89961	2025-01-02 12:13:15.656137	8421.39\n\nLa transformation d├®crite, qui consiste en la filtration de l'extrait de calendula, correspond au code douanier 8421.39 qui englobe les appareils pour le filtrage ou la purification des liquides. Dans ce cas, la filtration est une ├®tape de transformation qui vise ├á purifier l'extrait de calendula, ce qui justifie ce choix de code.\n\nAlternative possible:\n- 8421.21 : Les filtres pour liquides ou gaz sont inclus dans cette sous-position, mais le code 8421.39 semble plus pr├®cis dans ce contexte sp├®cifique de filtration d'extrait de calendula.
15	Standardisation	1	STD-COS001	Portugal	130.00	3301.29	Standardisation de la concentration	5	2024-12-29 10:55:38.89961	2025-01-02 12:13:15.656137	3301.29\n\nLa transformation d├®crite (standardisation de la concentration) implique un processus de modification de la mati├¿re premi├¿re d'origine (Cosgard) pour obtenir un produit final standardis├®. Le code douanier 3301.29 correspond aux pr├®parations pour l'entretien de la peau, comprenant des cosm├®tiques comme les produits de soins du visage ou les cr├¿mes, ce qui semble convenir ├á la transformation d├®crite. \n\nAlternativement, le code 3301.24 (pr├®parations pour le maquillage) pourrait ├®galement ├¬tre envisag├® en fonction du produit final obtenu apr├¿s la transformation.
8	Purification	3	PUR-AH001	Belgique	220.00	3822.00	Purification par chromatographie	3	2024-12-29 10:55:38.89961	2025-01-02 12:13:15.656137	3822.00\n\nL'acide hyaluronique est une substance d'origine v├®g├®tale utilis├®e en cosm├®tique et en m├®decine. La purification par chromatographie est un processus qui permet de s├®parer les diff├®rentes composantes de l'acide hyaluronique pour obtenir un produit purifi├®. Le code douanier 3822.00 est utilis├® pour les produits de laboratoire ou de pharmacie, ce qui semble appropri├® pour d├®crire le processus de purification de l'acide hyaluronique. \n\nUne alternative possible pourrait ├¬tre le code 3006.30 pour les produits pharmaceutiques ├á base d'acide hyaluronique, mais le code 3822.00 semble plus adapt├® pour d├®crire le processus de purification sp├®cifique mentionn├®.
9	Lyophilisation	3	LYO-AH001	Pays-Bas	240.00	3006.30	Lyophilisation pour obtention de poudre	3	2024-12-29 10:55:38.89961	2025-01-02 12:13:15.656137	3006.30\n\nLa lyophilisation est un processus de s├®chage utilis├® pour stabiliser des substances sensibles ├á la chaleur ou ├á l'humidit├®. Dans ce cas, la mati├¿re premi├¿re d'origine est l'acide hyaluronique, qui est un polysaccharide pr├®sent naturellement dans le corps humain et utilis├® dans divers produits cosm├®tiques et pharmaceutiques. La lyophilisation de l'acide hyaluronique pour obtenir de la poudre est une transformation qui vise ├á prolonger sa dur├®e de conservation et ├á faciliter son transport et son stockage.\n\nLe code douanier 3006.30 est sp├®cifique aux pr├®parations pharmaceutiques ├á usage v├®t├®rinaire, ce qui correspond ├á la nature de la transformation d├®crite. Il englobe les produits obtenus ├á partir de mati├¿res premi├¿res d'origine animale ou v├®g├®tale, comme c'est le cas avec l'acide hyaluronique d'origine naturelle. Cette classification est donc la plus appropri├®e pour la lyophilisation de l'acide hyaluronique.\n\nAlternativement, d
3	Filtration	1	FILT-LAV001	Espagne	160.00	8421.39	Filtration fine pour ├®liminer les impuret├®s	1	2024-12-29 10:55:38.89961	2025-01-02 12:13:15.656137	8421.39\n\nLa filtration est un processus de transformation qui consiste ├á s├®parer les impuret├®s d'une substance liquide, en l'occurrence l'huile essentielle de lavande dans ce cas. Le code douanier 8421.39 est appropri├® car il concerne les machines et appareils pour filtrer ou purifier les liquides. Dans ce cas, la filtration fine pour ├®liminer les impuret├®s de l'huile essentielle de lavande serait class├®e sous cette cat├®gorie. \n\nAlternatives possibles:\n- 8421.21 : pour les filtres pour liquides\n- 8421.29 : pour les autres machines et appareils pour filtrer ou purifier les liquides
12	Formulation	10	FORM-PRF001	Gr├¿ce	350.00	3303.00	Formulation finale du parfum	4	2024-12-29 10:55:38.89961	2025-01-02 17:11:45.737681	3303.00\n\nJ'ai choisi le code douanier 3303.00 car il correspond aux pr├®parations pour l'industrie de la parfumerie ou des cosm├®tiques. Dans ce cas, la formulation finale du parfum ├á base de parfum de rose en provenance de Gr├¿ce serait class├®e sous ce code douanier.\n\nAlternatives possibles :\n- 3304.99 (Autres pr├®parations de beaut├® ou de maquillage)\n- 3307.49 (Autres pr├®parations pour parfumerie ou cosm├®tique)
17	Sechage	5	P0001	France	34.00	1211.90		6	2024-12-29 21:01:19.83027	2025-01-02 17:12:01.819021	1211.90\n\nJe choisis le code douanier 1211.90 car il correspond ├á "Plantes et parties de plantes (y compris les graines et les fruits), utilis├®es principalement en tant que mati├¿re premi├¿re pour la pr├®paration de boissons". Dans ce cas, la m├®lisse est une plante utilis├®e pour ses propri├®t├®s aromatiques et m├®dicinales, ce qui correspond ├á une utilisation potentielle pour la pr├®paration de boissons ou d'autres produits. La transformation en "S├®chage" peut ├¬tre consid├®r├®e comme une m├®thode de pr├®paration de la mati├¿re premi├¿re pour une utilisation ult├®rieure.\n\nUne alternative pourrait ├¬tre le code 1211.30 qui concerne les plantes aromatiques ou m├®dicinales, mais le choix du code 1211.90 est plus large et englobe une vari├®t├® de plantes et de parties de plantes.
11	Distillation fractionn├®e	4	DIST-PRF001	Bulgarie	320.00	8419.50	S├®paration des compos├®s par distillation fractionn├®e	4	2024-12-29 10:55:38.89961	2025-01-02 12:13:15.656137	8419.50\n\nLa distillation fractionn├®e est une m├®thode de s├®paration des compos├®s d'un m├®lange liquide en fonction de leurs points d'├®bullition respectifs. Dans ce cas, la mati├¿re premi├¿re d'origine est le parfum de rose provenant de Bulgarie, et la transformation consiste ├á s├®parer les diff├®rents compos├®s du parfum par distillation fractionn├®e. Le code douanier 8419.50 est appropri├® car il concerne les "Machines et appareils pour distillation et rectification" et englobe les ├®quipements utilis├®s pour la distillation fractionn├®e. \n\nAlternative possible:\n8419.50.90 - Autres\n\nCette alternative peut ├¬tre utilis├®e si la transformation implique un type sp├®cifique de machine ou d'appareil de distillation fractionn├®e qui n'est pas couvert par les sous-cat├®gories pr├®c├®dentes.
1	Distillation vapeur	1	DIST-LAV001	France	150.00	3301.29	Distillation ├á la vapeur d'eau des fleurs de lavande	1	2024-12-29 10:55:38.89961	2025-01-02 12:13:15.656137	3301.29\n\nLa distillation ├á la vapeur est une m├®thode de transformation courante pour les huiles essentielles, consistant ├á chauffer les mati├¿res premi├¿res avec de la vapeur d'eau pour en extraire les compos├®s volatils. Dans ce cas sp├®cifique, la mati├¿re premi├¿re d'origine est l'huile essentielle de lavande, produite ├á partir des fleurs de lavande. ├ëtant donn├® que la transformation d├®crite implique uniquement la distillation ├á la vapeur des fleurs de lavande pour obtenir de l'huile essentielle, le code douanier le plus appropri├® serait 3301.29 - Huiles essentielles de lavande.\n\nAlternativement, si le produit final est une huile essentielle de lavande en tant que telle, le code 3301.29 reste appropri├®. Si d'autres produits sont obtenus lors de la distillation ├á la vapeur des fleurs de lavande, il faudrait alors envisager des codes douaniers suppl├®mentaires pour ces produits sp├®cifiques.
4	Mac├®ration	2	MAC-CAL001	Allemagne	80.00	1515.90	Mac├®ration des fleurs de calendula dans huile v├®g├®tale	2	2024-12-29 10:55:38.89961	2025-01-02 12:13:15.656137	1515.90\n\nJ'ai choisi le code douanier 1515.90 qui correspond aux huiles v├®g├®tales et graisses animales ou v├®g├®tales, et leurs fractions, non comestibles. Dans ce cas, la transformation d├®crite implique la mac├®ration des fleurs de calendula dans une huile v├®g├®tale, ce qui correspond ├á cette cat├®gorie de produits. L'origine en Allemagne n'est pas prise en compte dans le code douanier, mais peut ├¬tre mentionn├®e ├á des fins de tra├ºabilit├®.\n\nAlternativement, on pourrait utiliser le code 1302.14 pour les extraits de plantes, racines et tubercules contenant des substances amylac├®es. Cependant, ├®tant donn├® que le processus d├®crit met en avant la mac├®ration des fleurs dans de l'huile v├®g├®tale, le code 1515.90 semble ├¬tre le plus appropri├® dans ce cas.
6	Concentration	2	CONC-CAL001	Suisse	100.00	1302.13	Concentration de l'extrait par ├®vaporation	2	2024-12-29 10:55:38.89961	2025-01-02 12:26:02.362675	3301.29\n\nL'extrait de calendula est une mati├¿re v├®g├®tale d'origine v├®g├®tale (code 33) et la concentration par ├®vaporation est une m├®thode de transformation qui ne change pas la nature de la mati├¿re premi├¿re. Ainsi, le code douanier le plus appropri├® pour cette transformation serait 3301.29, qui correspond aux extraits v├®g├®taux obtenus par des proc├®d├®s de concentration.\n\nAlternative: 1302.13 - Cette cat├®gorie concerne les extraits de plantes obtenus par des proc├®d├®s de concentration, mais le code 3301.29 est plus sp├®cifique pour les extraits v├®g├®taux.
14	Purification	1	PUR-COS001	Irlande	140.00	3302.90	Purification par distillation	5	2024-12-29 10:55:38.89961	2025-01-02 12:26:13.133337	3302.10\nLa purification par distillation de la mati├¿re premi├¿re d'origine Cosgard correspond au code douanier 3302.10, qui concerne les pr├®parations pour la toilette. Dans ce cas, la purification par distillation indique un processus de transformation de la mati├¿re premi├¿re d'origine pour en faire une pr├®paration sp├®cifique destin├®e ├á ├¬tre utilis├®e dans des produits de toilette ou de soins. Le fait que la mati├¿re premi├¿re d'origine soit le Cosgard et que la purification soit effectu├®e en Irlande n'affecte pas le code douanier, car ce dernier se base principalement sur le processus de transformation effectu├® sur la mati├¿re premi├¿re. \n\nAlternative possible:\n3302.90 - Autres pr├®parations pour la toilette, qui pourrait ├®galement convenir selon le d├®tail de la purification effectu├®e sur le Cosgard.
7	Fermentation	3	FERM-AH001	France	200.00	3502.11	Fermentation bact├®rienne pour production d'acide hyaluronique	3	2024-12-29 10:55:38.89961	2025-01-02 12:13:15.656137	3502.11\n\nL'acide hyaluronique est class├® sous le code douanier 3502.11, qui correspond aux pr├®parations ├á base d'acide hyaluronique. Dans ce cas, la transformation d├®crite consiste en une fermentation bact├®rienne pour la production d'acide hyaluronique ├á partir de sa mati├¿re premi├¿re d'origine. Cette transformation est une m├®thode courante pour produire de l'acide hyaluronique ├á des fins cosm├®tiques ou m├®dicales. L'origine en France peut ├®galement ├¬tre mentionn├®e pour b├®n├®ficier de certains accords commerciaux ou pr├®f├®rentiels.\n\nAlternatives possibles:\n- 3502.90 (autres pr├®parations contenant des acides amin├®s ou leurs sels)\n- 3002.10 (sang humain; plasma sanguin)\nCes alternatives pourraient ├®galement ├¬tre envisag├®es en fonction des d├®tails sp├®cifiques de la transformation de l'acide hyaluronique.
10	Extraction solvant	4	EXT-PRF001	France	300.00	3301.29	Extraction par solvant des compos├®s odorants	4	2024-12-29 10:55:38.89961	2025-01-02 12:13:15.656137	3301.29\n\nL'extraction par solvant des compos├®s odorants de la mati├¿re premi├¿re d'origine (parfum rose) correspond au code douanier 3301.29, qui concerne les extraits et essences pour la fabrication de parfums. Ce code est sp├®cifique pour les extraits obtenus par des m├®thodes d'extraction comme l'extraction par solvant. La mention de l'origine (France) peut ├¬tre utile pour d├®terminer d'├®ventuelles pr├®f├®rences tarifaires en fonction des accords commerciaux en place.\n\nAlternativement, le code 3301.90 (autres extraits et essences) pourrait ├®galement ├¬tre consid├®r├® si la transformation ne correspond pas exactement ├á la description du 3301.29.
13	Synth├¿se	1	SYN-COS001	France	120.00	3402.90	Synth├¿se chimique du conservateur	5	2024-12-29 10:55:38.89961	2025-01-02 12:13:15.656137	3402.90\n\nCette transformation consiste en la synth├¿se chimique d'un conservateur ├á partir de la mati├¿re premi├¿re Cosgard en France. Le code douanier 3402.90 est appropri├® car il concerne les produits ├á usage cosm├®tique ou de toilette, qui incluent les conservateurs utilis├®s dans les produits cosm├®tiques. La mention "Synth├¿se chimique" indique clairement qu'il s'agit d'un produit r├®sultant d'une transformation chimique. L'origine fran├ºaise de la mati├¿re premi├¿re est ├®galement un ├®l├®ment important ├á prendre en compte pour la classification douani├¿re.\n\nAlternatives possibles :\n- 2918.15 : Autres compos├®s organiques contenant des fonctions aromatiques, utilis├®s principalement comme r├®actifs pour la synth├¿se\n- 3808.94 : Produits ├á usage cosm├®tique contenant des conservateurs\n\nCependant, le code 3402.90 reste le plus sp├®cifique et appropri├® pour cette transformation en particulier.
16	Transport	5	MP001	France	12.00	1515.90		7	2024-12-29 19:21:21.810661	2025-01-02 17:11:55.102695	1515.90\n\nL'huile de m├®lisse est class├®e sous le code douanier 1515.90, qui correspond aux autres huiles essentielles et r├®sino├»des. Ce code est utilis├® pour les huiles essentielles qui ne sont pas sp├®cifiquement r├®pertori├®es ailleurs dans la nomenclature douani├¿re. Dans ce cas, puisque la transformation d├®crite est vague et ne fournit pas de d├®tails sp├®cifiques sur le produit final ni sur son origine, le code 1515.90 est le plus appropri├® car il couvre une gamme d'huiles essentielles non sp├®cifi├®es. \n\nAlternativement, si des informations plus pr├®cises ├®taient disponibles sur le produit final ou sur son origine, il serait recommand├® d'utiliser un code douanier plus sp├®cifique en fonction de ces d├®tails.
\.


--
-- Name: analyses_bon_livraison_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.analyses_bon_livraison_id_seq', 5, true);


--
-- Name: analyses_bulletin_analyse_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.analyses_bulletin_analyse_id_seq', 5, true);


--
-- Name: documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.documents_id_seq', 17, true);


--
-- Name: documents_requis_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.documents_requis_id_seq', 27, true);


--
-- Name: fournisseurs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.fournisseurs_id_seq', 19, true);


--
-- Name: matieres_premieres_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.matieres_premieres_id_seq', 34, true);


--
-- Name: matieres_transformations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.matieres_transformations_id_seq', 1, false);


--
-- Name: produits_finis_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.produits_finis_id_seq', 5, true);


--
-- Name: resultats_bon_livraison_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.resultats_bon_livraison_id_seq', 1, false);


--
-- Name: resultats_bulletin_analyse_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.resultats_bulletin_analyse_id_seq', 1, false);


--
-- Name: semi_finis_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.semi_finis_id_seq', 1, true);


--
-- Name: transformations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.transformations_id_seq', 17, true);


--
-- Name: analyses_bon_livraison analyses_bon_livraison_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.analyses_bon_livraison
    ADD CONSTRAINT analyses_bon_livraison_pkey PRIMARY KEY (id);


--
-- Name: analyses_bulletin_analyse analyses_bulletin_analyse_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.analyses_bulletin_analyse
    ADD CONSTRAINT analyses_bulletin_analyse_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: documents_requis documents_requis_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents_requis
    ADD CONSTRAINT documents_requis_pkey PRIMARY KEY (id);


--
-- Name: documents_requis documents_requis_type_element_type_document_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents_requis
    ADD CONSTRAINT documents_requis_type_element_type_document_key UNIQUE (type_element, type_document);


--
-- Name: fournisseurs fournisseurs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fournisseurs
    ADD CONSTRAINT fournisseurs_pkey PRIMARY KEY (id);


--
-- Name: matieres_premieres matieres_premieres_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.matieres_premieres
    ADD CONSTRAINT matieres_premieres_pkey PRIMARY KEY (id);


--
-- Name: matieres_transformations matieres_transformations_matiere_premiere_id_transformation_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.matieres_transformations
    ADD CONSTRAINT matieres_transformations_matiere_premiere_id_transformation_key UNIQUE (matiere_premiere_id, transformation_id);


--
-- Name: matieres_transformations matieres_transformations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.matieres_transformations
    ADD CONSTRAINT matieres_transformations_pkey PRIMARY KEY (id);


--
-- Name: produits_finis produits_finis_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.produits_finis
    ADD CONSTRAINT produits_finis_pkey PRIMARY KEY (id);


--
-- Name: resultats_bon_livraison resultats_bon_livraison_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resultats_bon_livraison
    ADD CONSTRAINT resultats_bon_livraison_pkey PRIMARY KEY (id);


--
-- Name: resultats_bulletin_analyse resultats_bulletin_analyse_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resultats_bulletin_analyse
    ADD CONSTRAINT resultats_bulletin_analyse_pkey PRIMARY KEY (id);


--
-- Name: semi_finis_matieres_premieres semi_finis_matieres_premieres_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.semi_finis_matieres_premieres
    ADD CONSTRAINT semi_finis_matieres_premieres_pkey PRIMARY KEY (semi_fini_id, matiere_premiere_id);


--
-- Name: semi_finis semi_finis_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.semi_finis
    ADD CONSTRAINT semi_finis_pkey PRIMARY KEY (id);


--
-- Name: semi_finis_transformations semi_finis_transformations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.semi_finis_transformations
    ADD CONSTRAINT semi_finis_transformations_pkey PRIMARY KEY (semi_fini_id, transformation_id);


--
-- Name: transformations transformations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transformations
    ADD CONSTRAINT transformations_pkey PRIMARY KEY (id);


--
-- Name: analyses_bon_livraison update_analyses_bon_livraison_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_analyses_bon_livraison_updated_at BEFORE UPDATE ON public.analyses_bon_livraison FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: analyses_bulletin_analyse update_analyses_bulletin_analyse_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_analyses_bulletin_analyse_updated_at BEFORE UPDATE ON public.analyses_bulletin_analyse FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: documents update_documents_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: fournisseurs update_fournisseurs_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_fournisseurs_updated_at BEFORE UPDATE ON public.fournisseurs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: matieres_premieres update_matieres_premieres_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_matieres_premieres_updated_at BEFORE UPDATE ON public.matieres_premieres FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: resultats_bon_livraison update_resultats_bon_livraison_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_resultats_bon_livraison_updated_at BEFORE UPDATE ON public.resultats_bon_livraison FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: resultats_bulletin_analyse update_resultats_bulletin_analyse_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_resultats_bulletin_analyse_updated_at BEFORE UPDATE ON public.resultats_bulletin_analyse FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: semi_finis update_semi_finis_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_semi_finis_updated_at BEFORE UPDATE ON public.semi_finis FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: transformations update_transformations_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_transformations_updated_at BEFORE UPDATE ON public.transformations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: analyses_bon_livraison analyses_bon_livraison_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.analyses_bon_livraison
    ADD CONSTRAINT analyses_bon_livraison_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id);


--
-- Name: analyses_bon_livraison analyses_bon_livraison_matiere_premiere_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.analyses_bon_livraison
    ADD CONSTRAINT analyses_bon_livraison_matiere_premiere_id_fkey FOREIGN KEY (matiere_premiere_id) REFERENCES public.matieres_premieres(id);


--
-- Name: analyses_bulletin_analyse analyses_bulletin_analyse_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.analyses_bulletin_analyse
    ADD CONSTRAINT analyses_bulletin_analyse_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id);


--
-- Name: analyses_bulletin_analyse analyses_bulletin_analyse_matiere_premiere_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.analyses_bulletin_analyse
    ADD CONSTRAINT analyses_bulletin_analyse_matiere_premiere_id_fkey FOREIGN KEY (matiere_premiere_id) REFERENCES public.matieres_premieres(id);


--
-- Name: documents documents_matiere_premiere_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_matiere_premiere_id_fkey FOREIGN KEY (matiere_premiere_id) REFERENCES public.matieres_premieres(id);


--
-- Name: documents documents_produit_fini_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_produit_fini_id_fkey FOREIGN KEY (produit_fini_id) REFERENCES public.produits_finis(id);


--
-- Name: documents documents_semi_fini_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_semi_fini_id_fkey FOREIGN KEY (semi_fini_id) REFERENCES public.semi_finis(id);


--
-- Name: documents documents_transformation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_transformation_id_fkey FOREIGN KEY (transformation_id) REFERENCES public.transformations(id);


--
-- Name: matieres_premieres matieres_premieres_fournisseur_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.matieres_premieres
    ADD CONSTRAINT matieres_premieres_fournisseur_id_fkey FOREIGN KEY (fournisseur_id) REFERENCES public.fournisseurs(id);


--
-- Name: matieres_transformations matieres_transformations_matiere_premiere_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.matieres_transformations
    ADD CONSTRAINT matieres_transformations_matiere_premiere_id_fkey FOREIGN KEY (matiere_premiere_id) REFERENCES public.matieres_premieres(id) ON DELETE CASCADE;


--
-- Name: matieres_transformations matieres_transformations_transformation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.matieres_transformations
    ADD CONSTRAINT matieres_transformations_transformation_id_fkey FOREIGN KEY (transformation_id) REFERENCES public.transformations(id) ON DELETE CASCADE;


--
-- Name: resultats_bon_livraison resultats_bon_livraison_analyse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resultats_bon_livraison
    ADD CONSTRAINT resultats_bon_livraison_analyse_id_fkey FOREIGN KEY (analyse_id) REFERENCES public.analyses_bon_livraison(id);


--
-- Name: resultats_bon_livraison resultats_bon_livraison_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resultats_bon_livraison
    ADD CONSTRAINT resultats_bon_livraison_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id);


--
-- Name: resultats_bulletin_analyse resultats_bulletin_analyse_analyse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resultats_bulletin_analyse
    ADD CONSTRAINT resultats_bulletin_analyse_analyse_id_fkey FOREIGN KEY (analyse_id) REFERENCES public.analyses_bulletin_analyse(id);


--
-- Name: resultats_bulletin_analyse resultats_bulletin_analyse_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resultats_bulletin_analyse
    ADD CONSTRAINT resultats_bulletin_analyse_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id);


--
-- Name: semi_finis_matieres_premieres semi_finis_matieres_premieres_matiere_premiere_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.semi_finis_matieres_premieres
    ADD CONSTRAINT semi_finis_matieres_premieres_matiere_premiere_id_fkey FOREIGN KEY (matiere_premiere_id) REFERENCES public.matieres_premieres(id);


--
-- Name: semi_finis_matieres_premieres semi_finis_matieres_premieres_semi_fini_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.semi_finis_matieres_premieres
    ADD CONSTRAINT semi_finis_matieres_premieres_semi_fini_id_fkey FOREIGN KEY (semi_fini_id) REFERENCES public.semi_finis(id);


--
-- Name: semi_finis_transformations semi_finis_transformations_semi_fini_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.semi_finis_transformations
    ADD CONSTRAINT semi_finis_transformations_semi_fini_id_fkey FOREIGN KEY (semi_fini_id) REFERENCES public.semi_finis(id);


--
-- Name: semi_finis_transformations semi_finis_transformations_transformation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.semi_finis_transformations
    ADD CONSTRAINT semi_finis_transformations_transformation_id_fkey FOREIGN KEY (transformation_id) REFERENCES public.transformations(id);


--
-- Name: transformations transformations_fournisseur_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transformations
    ADD CONSTRAINT transformations_fournisseur_id_fkey FOREIGN KEY (fournisseur_id) REFERENCES public.fournisseurs(id);


--
-- Name: transformations transformations_matiere_premiere_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transformations
    ADD CONSTRAINT transformations_matiere_premiere_id_fkey FOREIGN KEY (matiere_premiere_id) REFERENCES public.matieres_premieres(id);


--
-- PostgreSQL database dump complete
--

--
-- Database "postgres" dump
--

--
-- PostgreSQL database dump
--

-- Dumped from database version 17.2 (Debian 17.2-1.pgdg120+1)
-- Dumped by pg_dump version 17.2 (Debian 17.2-1.pgdg120+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP DATABASE postgres;
--
-- Name: postgres; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE postgres WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE postgres OWNER TO postgres;

\connect postgres

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: DATABASE postgres; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON DATABASE postgres IS 'default administrative connection database';


--
-- PostgreSQL database dump complete
--

--
-- PostgreSQL database cluster dump complete
--

