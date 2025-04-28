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

ALTER TABLE ONLY public.transformations DROP CONSTRAINT transformations_matiere_premiere_id_fkey;
ALTER TABLE ONLY public.transformations DROP CONSTRAINT transformations_fournisseur_id_fkey;
ALTER TABLE ONLY public.semi_finis_transformations DROP CONSTRAINT semi_finis_transformations_transformation_id_fkey;
ALTER TABLE ONLY public.semi_finis_transformations DROP CONSTRAINT semi_finis_transformations_semi_fini_id_fkey;
ALTER TABLE ONLY public.semi_finis_matieres_premieres DROP CONSTRAINT semi_finis_matieres_premieres_semi_fini_id_fkey;
ALTER TABLE ONLY public.semi_finis_matieres_premieres DROP CONSTRAINT semi_finis_matieres_premieres_matiere_premiere_id_fkey;
ALTER TABLE ONLY public.resultats_bulletin_analyse DROP CONSTRAINT resultats_bulletin_analyse_document_id_fkey;
ALTER TABLE ONLY public.resultats_bulletin_analyse DROP CONSTRAINT resultats_bulletin_analyse_analyse_id_fkey;
ALTER TABLE ONLY public.resultats_bon_livraison DROP CONSTRAINT resultats_bon_livraison_document_id_fkey;
ALTER TABLE ONLY public.resultats_bon_livraison DROP CONSTRAINT resultats_bon_livraison_analyse_id_fkey;
ALTER TABLE ONLY public.matieres_premieres DROP CONSTRAINT matieres_premieres_fournisseur_id_fkey;
ALTER TABLE ONLY public.documents DROP CONSTRAINT documents_transformation_id_fkey;
ALTER TABLE ONLY public.documents DROP CONSTRAINT documents_semi_fini_id_fkey;
ALTER TABLE ONLY public.documents DROP CONSTRAINT documents_produit_fini_id_fkey;
ALTER TABLE ONLY public.documents DROP CONSTRAINT documents_matiere_premiere_id_fkey;
ALTER TABLE ONLY public.analyses_bulletin_analyse DROP CONSTRAINT analyses_bulletin_analyse_matiere_premiere_id_fkey;
ALTER TABLE ONLY public.analyses_bulletin_analyse DROP CONSTRAINT analyses_bulletin_analyse_document_id_fkey;
ALTER TABLE ONLY public.analyses_bon_livraison DROP CONSTRAINT analyses_bon_livraison_matiere_premiere_id_fkey;
ALTER TABLE ONLY public.analyses_bon_livraison DROP CONSTRAINT analyses_bon_livraison_document_id_fkey;
DROP TRIGGER update_transformations_updated_at ON public.transformations;
DROP TRIGGER update_semi_finis_updated_at ON public.semi_finis;
DROP TRIGGER update_resultats_bulletin_analyse_updated_at ON public.resultats_bulletin_analyse;
DROP TRIGGER update_resultats_bon_livraison_updated_at ON public.resultats_bon_livraison;
DROP TRIGGER update_matieres_premieres_updated_at ON public.matieres_premieres;
DROP TRIGGER update_fournisseurs_updated_at ON public.fournisseurs;
DROP TRIGGER update_documents_updated_at ON public.documents;
DROP TRIGGER update_analyses_bulletin_analyse_updated_at ON public.analyses_bulletin_analyse;
DROP TRIGGER update_analyses_bon_livraison_updated_at ON public.analyses_bon_livraison;
ALTER TABLE ONLY public.transformations DROP CONSTRAINT transformations_pkey;
ALTER TABLE ONLY public.semi_finis_transformations DROP CONSTRAINT semi_finis_transformations_pkey;
ALTER TABLE ONLY public.semi_finis DROP CONSTRAINT semi_finis_pkey;
ALTER TABLE ONLY public.semi_finis_matieres_premieres DROP CONSTRAINT semi_finis_matieres_premieres_pkey;
ALTER TABLE ONLY public.resultats_bulletin_analyse DROP CONSTRAINT resultats_bulletin_analyse_pkey;
ALTER TABLE ONLY public.resultats_bon_livraison DROP CONSTRAINT resultats_bon_livraison_pkey;
ALTER TABLE ONLY public.produits_finis DROP CONSTRAINT produits_finis_pkey;
ALTER TABLE ONLY public.matieres_premieres DROP CONSTRAINT matieres_premieres_pkey;
ALTER TABLE ONLY public.fournisseurs DROP CONSTRAINT fournisseurs_pkey;
ALTER TABLE ONLY public.documents_requis DROP CONSTRAINT documents_requis_type_element_type_document_key;
ALTER TABLE ONLY public.documents_requis DROP CONSTRAINT documents_requis_pkey;
ALTER TABLE ONLY public.documents DROP CONSTRAINT documents_pkey;
ALTER TABLE ONLY public.analyses_bulletin_analyse DROP CONSTRAINT analyses_bulletin_analyse_pkey;
ALTER TABLE ONLY public.analyses_bon_livraison DROP CONSTRAINT analyses_bon_livraison_pkey;
ALTER TABLE public.transformations ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.semi_finis ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.resultats_bulletin_analyse ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.resultats_bon_livraison ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.produits_finis ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.matieres_premieres ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.fournisseurs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.documents_requis ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.documents ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.analyses_bulletin_analyse ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.analyses_bon_livraison ALTER COLUMN id DROP DEFAULT;
DROP VIEW public.vue_transformations;
DROP SEQUENCE public.transformations_id_seq;
DROP TABLE public.transformations;
DROP TABLE public.semi_finis_transformations;
DROP TABLE public.semi_finis_matieres_premieres;
DROP SEQUENCE public.semi_finis_id_seq;
DROP TABLE public.semi_finis;
DROP SEQUENCE public.resultats_bulletin_analyse_id_seq;
DROP TABLE public.resultats_bulletin_analyse;
DROP SEQUENCE public.resultats_bon_livraison_id_seq;
DROP TABLE public.resultats_bon_livraison;
DROP SEQUENCE public.produits_finis_id_seq;
DROP TABLE public.produits_finis;
DROP SEQUENCE public.matieres_premieres_id_seq;
DROP TABLE public.matieres_premieres;
DROP SEQUENCE public.fournisseurs_id_seq;
DROP TABLE public.fournisseurs;
DROP SEQUENCE public.documents_requis_id_seq;
DROP TABLE public.documents_requis;
DROP SEQUENCE public.documents_id_seq;
DROP TABLE public.documents;
DROP SEQUENCE public.analyses_bulletin_analyse_id_seq;
DROP TABLE public.analyses_bulletin_analyse;
DROP SEQUENCE public.analyses_bon_livraison_id_seq;
DROP TABLE public.analyses_bon_livraison;
DROP FUNCTION public.update_updated_at_column();
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
    CONSTRAINT documents_status_check CHECK (((status)::text = ANY ((ARRAY['en_attente'::character varying, 'valide'::character varying, 'rejete'::character varying])::text[]))),
    CONSTRAINT documents_type_document_check CHECK (((type_document)::text = ANY ((ARRAY['bon_livraison'::character varying, 'bulletin_analyse'::character varying, 'certificat'::character varying, 'controle_qualite'::character varying, 'certificat_transformation'::character varying, 'certificat_conformite'::character varying, 'certificat_origine'::character varying, 'facture'::character varying, 'certificat_phytosanitaire'::character varying, 'fiche_technique'::character varying, 'bon_fabrication'::character varying, 'declaration_douaniere'::character varying])::text[])))
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
    CONSTRAINT matieres_premieres_type_check CHECK (((type)::text = ANY ((ARRAY['metal'::character varying, 'plastic'::character varying, 'plante'::character varying, 'extrait'::character varying, 'carton'::character varying, 'verre'::character varying, 'tissu'::character varying])::text[])))
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
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
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
2	12	\N	2024-12-29 16:10:55.693485	t	t	t	t	t	t	t	t	Document conforme à toutes les exigences. Tous les champs obligatoires sont présents et correctement remplis.	1.00	2024-12-29 16:10:55.693485	2024-12-29 16:10:55.693485
3	16	\N	2024-12-29 16:17:14.169505	t	t	t	t	t	t	t	t	Document conforme à toutes les exigences. Tous les champs obligatoires sont présents et correctement remplis.	1.00	2024-12-29 16:17:14.169505	2024-12-29 16:17:14.169505
4	15	\N	2024-12-29 16:17:14.169505	t	t	t	t	f	t	t	t	Document globalement conforme. L'adresse de départ est manquante.	0.88	2024-12-29 16:17:14.169505	2024-12-29 16:17:14.169505
5	13	\N	2024-12-29 16:17:14.169505	t	t	t	t	t	t	f	t	Document globalement conforme. Le poids des colis n'est pas spécifié.	0.88	2024-12-29 16:17:14.169505	2024-12-29 16:17:14.169505
1	7	\N	2024-12-29 18:30:39.795068	f	t	t	t	t	t	t	f	[Le document fourni est un bon de livraison qui comprend toutes les informations mentionnées pour l'analyse. Il a été délivré le 01.03.2024 et porte le numéro 80337620. Le fournisseur est LAMBERT & VALETTE - GROUPE HEPPNER, et la matière première fournie est GATULINE LINK N LIFT. Le document donne les adresses de départ et de destination, ainsi que le poids du colis de 496,850 KG. Le mode de transport est par route.]	0.75	2024-12-29 16:01:58.132237	2024-12-29 18:30:39.795068
\.


--
-- Data for Name: analyses_bulletin_analyse; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.analyses_bulletin_analyse (id, document_id, matiere_premiere_id, date_analyse, date_document, nom_fournisseur, numero_lot, numero_commande, nom_matiere_premiere, caracteristiques_matiere, resume, ratio_conformite, created_at, updated_at) FROM stdin;
2	11	\N	2024-12-29 16:10:55.697794	t	t	t	f	t	t	Document globalement conforme. Le numéro de commande est manquant mais tous les autres champs sont présents.	0.85	2024-12-29 16:10:55.697794	2024-12-29 16:10:55.697794
3	17	\N	2024-12-29 16:17:14.173768	t	t	t	t	t	t	Document conforme à toutes les exigences. Tous les champs obligatoires sont présents et correctement remplis.	1.00	2024-12-29 16:17:14.173768	2024-12-29 16:17:14.173768
4	14	\N	2024-12-29 16:17:14.173768	t	t	t	f	t	t	Document globalement conforme. Le numéro de commande est manquant.	0.83	2024-12-29 16:17:14.173768	2024-12-29 16:17:14.173768
5	16	\N	2024-12-29 17:47:18.678696	f	f	f	f	f	f		NaN	2024-12-29 17:47:18.678696	2024-12-29 17:47:18.678696
1	7	\N	2024-12-29 18:30:50.710354	f	t	t	t	t	f	Le document donné est un bulletin d'analyse daté du 19/11/2019. Il a été fourni par Jean GAZIGNAIRE S.A.S. Il fournit des informations sur l'huile essentielle de citron biologique, qui est notée comme une matière première aromatique biologique. Le numéro de lot est 1-23-108 et le numéro de commande est 461390. Le document comprend également des détails sur les caractéristiques organoleptiques et physico-chimiques de la matière première.	0.67	2024-12-29 16:05:24.109868	2024-12-29 18:30:50.710354
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
2	Botanica	Hauptstraße 25, 10178 Berlin	Allemagne	2024-12-29 10:55:38.894416	2024-12-29 10:55:38.894416
3	Making Cosmetics	15 Rue du Commerce, 75015 Paris	France	2024-12-29 10:55:38.894416	2024-12-29 10:55:38.894416
4	Création & Parfum	8 Avenue des Champs-Élysées, 75008 Paris	France	2024-12-29 10:55:38.894416	2024-12-29 10:55:38.894416
5	F01	\N	\N	2024-12-29 11:02:09.799048	2024-12-29 11:02:09.799048
6	F02	\N	\N	2024-12-29 21:12:21.208358	2024-12-29 21:12:21.208358
7	FR02	\N	\N	2024-12-29 21:12:56.825337	2024-12-29 21:12:56.825337
8	F03	\N	\N	2024-12-29 21:25:53.518787	2024-12-29 21:25:53.518787
\.


--
-- Data for Name: matieres_premieres; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.matieres_premieres (id, nom, type, lot, fournisseur_id, pays_origine, valeur, code_douanier, matiere_premiere_source, regle_origine, created_at, updated_at) FROM stdin;
2	Extrait de calendula	extrait	CAL2024002	2	Allemagne	\N	\N	Fleurs de Calendula Bio	Origine UE	2024-12-29 10:55:38.895973	2024-12-29 10:55:38.895973
3	Acide hyaluronique	extrait	AH2024003	3	France	\N	\N	Fermentation bactérienne	Origine UE	2024-12-29 10:55:38.895973	2024-12-29 10:55:38.895973
4	Parfum rose	extrait	PRF2024004	4	France	\N	\N	Synthèse	Origine UE	2024-12-29 10:55:38.895973	2024-12-29 10:55:38.895973
5	Cosgard	extrait	COS2024005	1	France	\N	\N	Synthèse chimique	Origine UE	2024-12-29 10:55:38.895973	2024-12-29 10:55:38.895973
1	Huile essentielle de lavande	extrait	LAV2024001	1	France	345.00	SH2	Lavande fine de Provence	Origine UE - PDO Provence	2024-12-29 10:55:38.895973	2024-12-29 11:00:59.249649
6	Melisse	plante	P0001	5	FR	342.00	SH1			2024-12-29 11:02:09.801126	2024-12-29 11:02:09.801126
7	Huile Melisse	extrait	MP001	5	FR	23.00	SH2	P0001		2024-12-29 11:02:41.272186	2024-12-29 11:02:55.647444
8	Gentiane	plante	P002	6	FR	234.00				2024-12-29 21:12:21.215862	2024-12-29 21:12:21.215862
9	Huile Gentiane	extrait	MP002	7	FR	23.00		P002		2024-12-29 21:12:56.827744	2024-12-29 21:12:56.827744
11	Huile Verveine	extrait	MP003	8	GE	234.00		P003		2024-12-29 21:26:20.726544	2024-12-29 21:26:20.726544
10	Verveine	plante	P003	8	FR	122.99	V67			2024-12-29 21:25:53.522222	2024-12-30 00:08:49.295063
\.


--
-- Data for Name: produits_finis; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.produits_finis (id, nom, origine, valeur, code_douanier, semi_fini_id, created_at, updated_at, sauce_id, pays_origine, lot_number) FROM stdin;
5	DS10	\N	23324	SH1	\N	2024-12-29 13:53:23.565925	2024-12-29 13:53:23.565925	1	\N	\N
4	DS9	\N	343	SH3	\N	2024-12-29 10:44:35.149174	2024-12-29 20:59:39.707736	1	HU	0899829
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
1	Sauce 4	S37	FR	246.00	SH35	2024-12-29 10:56:48.939628	2024-12-30 00:07:11.962251
\.


--
-- Data for Name: semi_finis_matieres_premieres; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.semi_finis_matieres_premieres (semi_fini_id, matiere_premiere_id) FROM stdin;
1	7
1	11
1	9
\.


--
-- Data for Name: semi_finis_transformations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.semi_finis_transformations (semi_fini_id, transformation_id) FROM stdin;
\.


--
-- Data for Name: transformations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transformations (id, nom, fournisseur_id, lot, origine, valeur, code_douanier, description, matiere_premiere_id, created_at, updated_at) FROM stdin;
1	Distillation vapeur	1	DIST-LAV001	France	150.00	3301.29	Distillation à la vapeur d'eau des fleurs de lavande	1	2024-12-29 10:55:38.89961	2024-12-29 10:55:38.89961
2	Rectification	1	RECT-LAV001	Italie	180.00	3301.29	Purification par rectification de l'huile essentielle	1	2024-12-29 10:55:38.89961	2024-12-29 10:55:38.89961
3	Filtration	1	FILT-LAV001	Espagne	160.00	3301.29	Filtration fine pour éliminer les impuretés	1	2024-12-29 10:55:38.89961	2024-12-29 10:55:38.89961
4	Macération	2	MAC-CAL001	Allemagne	80.00	1302.19	Macération des fleurs de calendula dans huile végétale	2	2024-12-29 10:55:38.89961	2024-12-29 10:55:38.89961
5	Filtration	2	FILT-CAL001	Autriche	90.00	1302.19	Filtration de l'extrait de calendula	2	2024-12-29 10:55:38.89961	2024-12-29 10:55:38.89961
6	Concentration	2	CONC-CAL001	Suisse	100.00	1302.19	Concentration de l'extrait par évaporation	2	2024-12-29 10:55:38.89961	2024-12-29 10:55:38.89961
7	Fermentation	3	FERM-AH001	France	200.00	2918.19	Fermentation bactérienne pour production d'acide hyaluronique	3	2024-12-29 10:55:38.89961	2024-12-29 10:55:38.89961
8	Purification	3	PUR-AH001	Belgique	220.00	2918.19	Purification par chromatographie	3	2024-12-29 10:55:38.89961	2024-12-29 10:55:38.89961
9	Lyophilisation	3	LYO-AH001	Pays-Bas	240.00	2918.19	Lyophilisation pour obtention de poudre	3	2024-12-29 10:55:38.89961	2024-12-29 10:55:38.89961
10	Extraction solvant	4	EXT-PRF001	France	300.00	3302.90	Extraction par solvant des composés odorants	4	2024-12-29 10:55:38.89961	2024-12-29 10:55:38.89961
11	Distillation fractionnée	4	DIST-PRF001	Bulgarie	320.00	3302.90	Séparation des composés par distillation fractionnée	4	2024-12-29 10:55:38.89961	2024-12-29 10:55:38.89961
12	Formulation	4	FORM-PRF001	Grèce	350.00	3302.90	Formulation finale du parfum	4	2024-12-29 10:55:38.89961	2024-12-29 10:55:38.89961
13	Synthèse	1	SYN-COS001	France	120.00	2905.49	Synthèse chimique du conservateur	5	2024-12-29 10:55:38.89961	2024-12-29 10:55:38.89961
14	Purification	1	PUR-COS001	Irlande	140.00	2905.49	Purification par distillation	5	2024-12-29 10:55:38.89961	2024-12-29 10:55:38.89961
15	Standardisation	1	STD-COS001	Portugal	130.00	2905.49	Standardisation de la concentration	5	2024-12-29 10:55:38.89961	2024-12-29 10:55:38.89961
16	Transport	5	MP001		12.00			7	2024-12-29 19:21:21.810661	2024-12-29 19:21:21.810661
17	Sechage	5	P0001		34.00			6	2024-12-29 21:01:19.83027	2024-12-29 21:01:19.83027
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

SELECT pg_catalog.setval('public.fournisseurs_id_seq', 8, true);


--
-- Name: matieres_premieres_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.matieres_premieres_id_seq', 11, true);


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

