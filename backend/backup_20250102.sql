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
\.


--
-- Data for Name: matieres_premieres; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.matieres_premieres (id, nom, type, lot, fournisseur_id, pays_origine, valeur, code_douanier, matiere_premiere_source, regle_origine, created_at, updated_at, code_douanier_gpt) FROM stdin;
11	Huile Verveine	extrait	MP003	8	GE	234.00	3301.29	P003		2024-12-29 21:26:20.726544	2025-01-02 12:11:00.714746	3301.29\n\nL'huile de verveine est généralement classée sous le code douanier 3301.29, qui concerne les huiles essentielles et résinoïdes; produits de parfumerie ou de toilette préparés. Ce code est approprié car il englobe les huiles essentielles extraites de plantes aromatiques, y compris l'huile de verveine. \n\nD'autres codes douaniers possibles pourraient être: \n- 3301.24 : Huiles essentielles d'agrumes, y compris la verveine citronnée.\n- 3301.29.90 : Autres huiles essentielles, si la verveine n'est pas spécifiquement mentionnée dans les codes plus détaillés. \n\nCependant, le code principal 3301.29 est le plus approprié pour l'huile de verveine en raison de sa nature d'huile essentielle extraite.
8	Gentiane	plante	P002	6	FR	234.00	1211.90			2024-12-29 21:12:21.215862	2025-01-02 12:11:00.714746	1211.90\n\nLa gentiane est une plante utilisée dans la fabrication de divers produits, notamment des liqueurs et des médicaments. Le code douanier 1211.90 est réservé aux plantes et parties de plantes non comestibles, ce qui correspond bien à la gentiane. Il s'agit d'une plante à usage médicinal ou pour la fabrication de produits pharmaceutiques. \n\nAlternatives possibles:\n- 1211.20 : Plantes et parties de plantes utilisées principalement dans l'industrie de la parfumerie, de la pharmacie ou à des fins insecticides, fongicides ou similaires.\n- 1211.30 : Plantes et parties de plantes utilisées principalement dans la teinture ou l'impression.\nCes alternatives pourraient également convenir en fonction de l'utilisation spécifique de la gentiane.
10	Verveine	plante	P003	8	FR	122.99	0602.90			2024-12-29 21:25:53.522222	2025-01-02 12:11:00.714746	0602.90\n\nLes plantes en général sont classées sous le code douanier 0602.90 dans le Système Harmonisé. La verveine, en tant que plante, serait donc classée sous ce code. Ce code couvre les plantes vivantes et les bulbes, les rhizomes, les boutures, les greffons et les graines pour la plantation. Il est important de noter que ce code est une catégorie générale et que des codes douaniers plus spécifiques pourraient être utilisés en fonction de la forme sous laquelle la verveine est importée/exportée (par exemple, séchée, en poudre, en extrait, etc.).
9	Huile Gentiane	extrait	MP002	7	FR	23.00	3301.29	P002		2024-12-29 21:12:56.827744	2025-01-02 12:11:00.714746	3301.29\n\nL'huile de gentiane est une substance végétale utilisée dans diverses industries, y compris l'industrie cosmétique et pharmaceutique. Le code douanier 3301.29 est spécifique pour les huiles essentielles et résinoïdes d'autres plantes aromatiques. La gentiane étant une plante aromatique, ce code douanier est le plus approprié pour l'huile de gentiane.\n\nAlternatives possibles:\n- 1302.19 (extrait végétal utilisé en pharmacie, médecine, etc.)\n- 3301.29.90 (autres huiles essentielles et résinoïdes)
3	Acide hyaluronique	extrait	AH2024003	3	France	567.80	3913.90	Fermentation bactérienne	Origine UE	2024-12-29 10:55:38.895973	2025-01-02 12:27:39.182091	3913.90\n\nL'acide hyaluronique est un polysaccharide naturel présent dans le corps humain et largement utilisé en cosmétique pour ses propriétés hydratantes et anti-âge. Le code douanier 3913.90 est spécifique pour "autres polysaccharides" non spécifiés ailleurs, ce qui inclut l'acide hyaluronique extrait par fermentation bactérienne.\n\nAlternative possible:\n- 3002.10 : Sang humain, acide hyaluronique obtenu à partir de sources animales.
5	Cosgard	extrait	COS2024005	1	France	178.90	3307.49	Synthèse chimique	Origine UE	2024-12-29 10:55:38.895973	2025-01-02 12:27:39.182091	3307.49\n\nLe code douanier 3307.49 correspond aux "préparations pour l'hygiène buccale ou dentaire, y compris les poudres et les crèmes pour le nettoyage des dents". Dans ce cas, le Cosgard, en tant qu'agent conservateur utilisé dans les produits cosmétiques et d'hygiène personnelle, pourrait être classé sous ce code douanier en raison de son utilisation potentielle dans des produits d'hygiène bucco-dentaire.\n\nDes alternatives possibles pourraient inclure:\n- 2909.49: Autres éthers alcooliques\n- 2909.49: Autres composés cycliques\n- 2918.15: Autres composés carbonylés\nIl est recommandé de vérifier spécifiquement la composition exacte du Cosgard pour déterminer avec précision le code douanier le plus approprié.
1	Huile essentielle de lavande	extrait	LAV2024001	1	France	345.00	3301.29	Lavande fine de Provence	Origine UE - PDO Provence	2024-12-29 10:55:38.895973	2025-01-02 12:11:00.714746	3301.29\n\nL'huile essentielle de lavande extraite de la lavande fine de Provence est classée sous le code douanier 3301.29. Ce code correspond aux huiles essentielles d'agrumes, d'aspic, de lavande, de lavandin, de mélisse, de menthe, de romarin et de thym. La lavande fine de Provence est une variété spécifique de lavande largement reconnue pour sa qualité et son parfum. \n\nDes codes douaniers alternatifs possibles pourraient inclure :\n- 3301.24 : Huiles essentielles de menthe\n- 3301.25 : Huiles essentielles de citron\n- 3301.26 : Huiles essentielles d'orange\n- 3301.29 : Autres huiles essentielles, y compris de lavande\n\nIl est recommandé de vérifier la classification spécifique avec les autorités douanières compétentes pour garantir une classification exacte.
7	Huile Melisse	extrait	MP001	5	FR	23.00	3301.29	P0001		2024-12-29 11:02:41.272186	2025-01-02 12:11:00.714746	3301.29\n\nL'huile de mélisse est une substance extraite de la plante de mélisse. Le code douanier 3301.29 est utilisé pour les huiles essentielles et résinoïdes obtenues par distillation et extraction, autres que celles de l'orange amère. Dans ce cas, l'huile de mélisse correspond à une huile extraite d'une plante spécifique, ce qui la classe dans cette catégorie.\n\nAlternatives possibles:\n- 3301.24 : Les huiles essentielles obtenues par extraction des agrumes, y compris l'orange amère. Cependant, étant donné que dans ce cas il s'agit d'huile de mélisse et non d'agrumes, ce code n'est pas le plus approprié.\n- 3301.29.90 : Autres huiles essentielles. Ce code pourrait être utilisé de manière plus générale si la description exacte de l'huile n'est pas disponible.
6	Melisse	plante	P0001	5	FR	342.00	1211.90			2024-12-29 11:02:09.801126	2025-01-02 12:11:00.714746	1211.90\n\nLa mélisse est une plante aromatique largement utilisée en cuisine et en herboristerie pour ses propriétés médicinales. Le code douanier le plus approprié pour la mélisse en tant que plante est 1211.90, qui correspond aux "Plantes et parties de plantes (y compris les graines et fruits), de nature à être utilisées principalement comme matières premières pour l'alimentation, non dénommées ni comprises ailleurs".\n\nDes alternatives possibles pourraient inclure:\n- 1211.90.90 : Autres\n- 1211.90.10 : Plantes aromatiques\n\nCependant, le code principal 1211.90 reste le plus approprié pour la mélisse en tant que plante.
4	Parfum rose	extrait	PRF2024004	4	France	432.60	3303.00	Synthèse	Origine UE	2024-12-29 10:55:38.895973	2025-01-02 12:27:39.182091	3303.00\n\nLes parfums sont classés sous le code douanier 3303.00, qui concerne les préparations pour l'entretien ou la toilette de la peau. Dans ce cas, le parfum en question est une préparation à base de rose, avec un type d'extrait. Même s'il est produit de manière synthétique, cela n'affecte pas le code douanier, car il est basé sur l'utilisation du produit (parfum) et non sur sa source (naturelle ou synthétique). Il n'est donc pas nécessaire de spécifier la source (synthèse) pour déterminer le code douanier approprié.\n\nDes alternatives pourraient inclure :\n- 3303.00.10 pour les préparations à base d'essences odorantes naturelles\n- 3303.00.90 pour les autres préparations parfumées
2	Extrait de calendula	extrait	CAL2024002	2	Allemagne	289.50	1302.14	Fleurs de Calendula Bio	Origine UE	2024-12-29 10:55:38.895973	2025-01-02 12:27:39.182091	1302.19\n\nLes extraits de calendula sont généralement classés sous le code douanier 1302.19, qui couvre les extraits végétaux à base d'autres plantes, fleurs ou fruits, autres que les algues. Le calendula, également connu sous le nom de souci officinal, est une plante utilisée pour ses propriétés apaisantes et anti-inflammatoires, ce qui le rend populaire dans les produits de soins de la peau et les produits pharmaceutiques.\n\nDes alternatives possibles pourraient inclure :\n- 1302.14 : pour les extraits de fleurs d'autres types de plantes\n- 1302.19.90 : pour les extraits végétaux non spécifiés ailleurs
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

COPY public.transformations (id, nom, fournisseur_id, lot, origine, valeur, code_douanier, description, matiere_premiere_id, created_at, updated_at, code_douanier_gpt) FROM stdin;
2	Rectification	1	RECT-LAV001	Italie	180.00	3301.90	Purification par rectification de l'huile essentielle	1	2024-12-29 10:55:38.89961	2025-01-02 12:24:24.860098	3301.29\n\nL'huile essentielle de lavande est une substance d'origine végétale (plante) et provient de l'Italie. La rectification est un processus de purification visant à améliorer la qualité de l'huile essentielle en éliminant les impuretés et en standardisant sa composition chimique. Le code douanier 3301.29 correspond aux huiles essentielles d'agrumes, d'eucalyptus, de géranium, de jasmin, de lavande, de menthe, de patchouli, de pin, de bois de rose, de santal, de thuya et d'ylang-ylang, ainsi qu'à la rectification de ces huiles. Il est donc le plus approprié pour cette transformation. \n\nAlternatives possibles:\n- 3301.24 pour les autres huiles essentielles, résinoïdes et mélanges contenant des huiles essentielles\n- 3301.90 pour les autres huiles essentielles et résinoïdes, non dénommées ni comprises
5	Filtration	2	FILT-CAL001	Autriche	90.00	8421.39	Filtration de l'extrait de calendula	2	2024-12-29 10:55:38.89961	2025-01-02 12:13:15.656137	8421.39\n\nLa transformation décrite, qui consiste en la filtration de l'extrait de calendula, correspond au code douanier 8421.39 qui englobe les appareils pour le filtrage ou la purification des liquides. Dans ce cas, la filtration est une étape de transformation qui vise à purifier l'extrait de calendula, ce qui justifie ce choix de code.\n\nAlternative possible:\n- 8421.21 : Les filtres pour liquides ou gaz sont inclus dans cette sous-position, mais le code 8421.39 semble plus précis dans ce contexte spécifique de filtration d'extrait de calendula.
15	Standardisation	1	STD-COS001	Portugal	130.00	3301.29	Standardisation de la concentration	5	2024-12-29 10:55:38.89961	2025-01-02 12:13:15.656137	3301.29\n\nLa transformation décrite (standardisation de la concentration) implique un processus de modification de la matière première d'origine (Cosgard) pour obtenir un produit final standardisé. Le code douanier 3301.29 correspond aux préparations pour l'entretien de la peau, comprenant des cosmétiques comme les produits de soins du visage ou les crèmes, ce qui semble convenir à la transformation décrite. \n\nAlternativement, le code 3301.24 (préparations pour le maquillage) pourrait également être envisagé en fonction du produit final obtenu après la transformation.
8	Purification	3	PUR-AH001	Belgique	220.00	3822.00	Purification par chromatographie	3	2024-12-29 10:55:38.89961	2025-01-02 12:13:15.656137	3822.00\n\nL'acide hyaluronique est une substance d'origine végétale utilisée en cosmétique et en médecine. La purification par chromatographie est un processus qui permet de séparer les différentes composantes de l'acide hyaluronique pour obtenir un produit purifié. Le code douanier 3822.00 est utilisé pour les produits de laboratoire ou de pharmacie, ce qui semble approprié pour décrire le processus de purification de l'acide hyaluronique. \n\nUne alternative possible pourrait être le code 3006.30 pour les produits pharmaceutiques à base d'acide hyaluronique, mais le code 3822.00 semble plus adapté pour décrire le processus de purification spécifique mentionné.
9	Lyophilisation	3	LYO-AH001	Pays-Bas	240.00	3006.30	Lyophilisation pour obtention de poudre	3	2024-12-29 10:55:38.89961	2025-01-02 12:13:15.656137	3006.30\n\nLa lyophilisation est un processus de séchage utilisé pour stabiliser des substances sensibles à la chaleur ou à l'humidité. Dans ce cas, la matière première d'origine est l'acide hyaluronique, qui est un polysaccharide présent naturellement dans le corps humain et utilisé dans divers produits cosmétiques et pharmaceutiques. La lyophilisation de l'acide hyaluronique pour obtenir de la poudre est une transformation qui vise à prolonger sa durée de conservation et à faciliter son transport et son stockage.\n\nLe code douanier 3006.30 est spécifique aux préparations pharmaceutiques à usage vétérinaire, ce qui correspond à la nature de la transformation décrite. Il englobe les produits obtenus à partir de matières premières d'origine animale ou végétale, comme c'est le cas avec l'acide hyaluronique d'origine naturelle. Cette classification est donc la plus appropriée pour la lyophilisation de l'acide hyaluronique.\n\nAlternativement, d
12	Formulation	4	FORM-PRF001	Gr??ce	350.00	3303.00	Formulation finale du parfum	4	2024-12-29 10:55:38.89961	2025-01-02 12:13:15.656137	3303.00\n\nJ'ai choisi le code douanier 3303.00 car il correspond aux préparations pour l'industrie de la parfumerie ou des cosmétiques. Dans ce cas, la formulation finale du parfum à base de parfum de rose en provenance de Grèce serait classée sous ce code douanier.\n\nAlternatives possibles :\n- 3304.99 (Autres préparations de beauté ou de maquillage)\n- 3307.49 (Autres préparations pour parfumerie ou cosmétique)
3	Filtration	1	FILT-LAV001	Espagne	160.00	8421.39	Filtration fine pour éliminer les impuretés	1	2024-12-29 10:55:38.89961	2025-01-02 12:13:15.656137	8421.39\n\nLa filtration est un processus de transformation qui consiste à séparer les impuretés d'une substance liquide, en l'occurrence l'huile essentielle de lavande dans ce cas. Le code douanier 8421.39 est approprié car il concerne les machines et appareils pour filtrer ou purifier les liquides. Dans ce cas, la filtration fine pour éliminer les impuretés de l'huile essentielle de lavande serait classée sous cette catégorie. \n\nAlternatives possibles:\n- 8421.21 : pour les filtres pour liquides\n- 8421.29 : pour les autres machines et appareils pour filtrer ou purifier les liquides
16	Transport	5	MP001		12.00	1515.90		7	2024-12-29 19:21:21.810661	2025-01-02 12:13:15.656137	1515.90\n\nL'huile de mélisse est classée sous le code douanier 1515.90, qui correspond aux autres huiles essentielles et résinoïdes. Ce code est utilisé pour les huiles essentielles qui ne sont pas spécifiquement répertoriées ailleurs dans la nomenclature douanière. Dans ce cas, puisque la transformation décrite est vague et ne fournit pas de détails spécifiques sur le produit final ni sur son origine, le code 1515.90 est le plus approprié car il couvre une gamme d'huiles essentielles non spécifiées. \n\nAlternativement, si des informations plus précises étaient disponibles sur le produit final ou sur son origine, il serait recommandé d'utiliser un code douanier plus spécifique en fonction de ces détails.
17	Sechage	5	P0001		34.00	1211.90		6	2024-12-29 21:01:19.83027	2025-01-02 12:13:15.656137	1211.90\n\nJe choisis le code douanier 1211.90 car il correspond à "Plantes et parties de plantes (y compris les graines et les fruits), utilisées principalement en tant que matière première pour la préparation de boissons". Dans ce cas, la mélisse est une plante utilisée pour ses propriétés aromatiques et médicinales, ce qui correspond à une utilisation potentielle pour la préparation de boissons ou d'autres produits. La transformation en "Séchage" peut être considérée comme une méthode de préparation de la matière première pour une utilisation ultérieure.\n\nUne alternative pourrait être le code 1211.30 qui concerne les plantes aromatiques ou médicinales, mais le choix du code 1211.90 est plus large et englobe une variété de plantes et de parties de plantes.
11	Distillation fractionnée	4	DIST-PRF001	Bulgarie	320.00	8419.50	Séparation des composés par distillation fractionnée	4	2024-12-29 10:55:38.89961	2025-01-02 12:13:15.656137	8419.50\n\nLa distillation fractionnée est une méthode de séparation des composés d'un mélange liquide en fonction de leurs points d'ébullition respectifs. Dans ce cas, la matière première d'origine est le parfum de rose provenant de Bulgarie, et la transformation consiste à séparer les différents composés du parfum par distillation fractionnée. Le code douanier 8419.50 est approprié car il concerne les "Machines et appareils pour distillation et rectification" et englobe les équipements utilisés pour la distillation fractionnée. \n\nAlternative possible:\n8419.50.90 - Autres\n\nCette alternative peut être utilisée si la transformation implique un type spécifique de machine ou d'appareil de distillation fractionnée qui n'est pas couvert par les sous-catégories précédentes.
1	Distillation vapeur	1	DIST-LAV001	France	150.00	3301.29	Distillation à la vapeur d'eau des fleurs de lavande	1	2024-12-29 10:55:38.89961	2025-01-02 12:13:15.656137	3301.29\n\nLa distillation à la vapeur est une méthode de transformation courante pour les huiles essentielles, consistant à chauffer les matières premières avec de la vapeur d'eau pour en extraire les composés volatils. Dans ce cas spécifique, la matière première d'origine est l'huile essentielle de lavande, produite à partir des fleurs de lavande. Étant donné que la transformation décrite implique uniquement la distillation à la vapeur des fleurs de lavande pour obtenir de l'huile essentielle, le code douanier le plus approprié serait 3301.29 - Huiles essentielles de lavande.\n\nAlternativement, si le produit final est une huile essentielle de lavande en tant que telle, le code 3301.29 reste approprié. Si d'autres produits sont obtenus lors de la distillation à la vapeur des fleurs de lavande, il faudrait alors envisager des codes douaniers supplémentaires pour ces produits spécifiques.
4	Macération	2	MAC-CAL001	Allemagne	80.00	1515.90	Macération des fleurs de calendula dans huile végétale	2	2024-12-29 10:55:38.89961	2025-01-02 12:13:15.656137	1515.90\n\nJ'ai choisi le code douanier 1515.90 qui correspond aux huiles végétales et graisses animales ou végétales, et leurs fractions, non comestibles. Dans ce cas, la transformation décrite implique la macération des fleurs de calendula dans une huile végétale, ce qui correspond à cette catégorie de produits. L'origine en Allemagne n'est pas prise en compte dans le code douanier, mais peut être mentionnée à des fins de traçabilité.\n\nAlternativement, on pourrait utiliser le code 1302.14 pour les extraits de plantes, racines et tubercules contenant des substances amylacées. Cependant, étant donné que le processus décrit met en avant la macération des fleurs dans de l'huile végétale, le code 1515.90 semble être le plus approprié dans ce cas.
6	Concentration	2	CONC-CAL001	Suisse	100.00	1302.13	Concentration de l'extrait par évaporation	2	2024-12-29 10:55:38.89961	2025-01-02 12:26:02.362675	3301.29\n\nL'extrait de calendula est une matière végétale d'origine végétale (code 33) et la concentration par évaporation est une méthode de transformation qui ne change pas la nature de la matière première. Ainsi, le code douanier le plus approprié pour cette transformation serait 3301.29, qui correspond aux extraits végétaux obtenus par des procédés de concentration.\n\nAlternative: 1302.13 - Cette catégorie concerne les extraits de plantes obtenus par des procédés de concentration, mais le code 3301.29 est plus spécifique pour les extraits végétaux.
14	Purification	1	PUR-COS001	Irlande	140.00	3302.90	Purification par distillation	5	2024-12-29 10:55:38.89961	2025-01-02 12:26:13.133337	3302.10\nLa purification par distillation de la matière première d'origine Cosgard correspond au code douanier 3302.10, qui concerne les préparations pour la toilette. Dans ce cas, la purification par distillation indique un processus de transformation de la matière première d'origine pour en faire une préparation spécifique destinée à être utilisée dans des produits de toilette ou de soins. Le fait que la matière première d'origine soit le Cosgard et que la purification soit effectuée en Irlande n'affecte pas le code douanier, car ce dernier se base principalement sur le processus de transformation effectué sur la matière première. \n\nAlternative possible:\n3302.90 - Autres préparations pour la toilette, qui pourrait également convenir selon le détail de la purification effectuée sur le Cosgard.
7	Fermentation	3	FERM-AH001	France	200.00	3502.11	Fermentation bactérienne pour production d'acide hyaluronique	3	2024-12-29 10:55:38.89961	2025-01-02 12:13:15.656137	3502.11\n\nL'acide hyaluronique est classé sous le code douanier 3502.11, qui correspond aux préparations à base d'acide hyaluronique. Dans ce cas, la transformation décrite consiste en une fermentation bactérienne pour la production d'acide hyaluronique à partir de sa matière première d'origine. Cette transformation est une méthode courante pour produire de l'acide hyaluronique à des fins cosmétiques ou médicales. L'origine en France peut également être mentionnée pour bénéficier de certains accords commerciaux ou préférentiels.\n\nAlternatives possibles:\n- 3502.90 (autres préparations contenant des acides aminés ou leurs sels)\n- 3002.10 (sang humain; plasma sanguin)\nCes alternatives pourraient également être envisagées en fonction des détails spécifiques de la transformation de l'acide hyaluronique.
10	Extraction solvant	4	EXT-PRF001	France	300.00	3301.29	Extraction par solvant des composés odorants	4	2024-12-29 10:55:38.89961	2025-01-02 12:13:15.656137	3301.29\n\nL'extraction par solvant des composés odorants de la matière première d'origine (parfum rose) correspond au code douanier 3301.29, qui concerne les extraits et essences pour la fabrication de parfums. Ce code est spécifique pour les extraits obtenus par des méthodes d'extraction comme l'extraction par solvant. La mention de l'origine (France) peut être utile pour déterminer d'éventuelles préférences tarifaires en fonction des accords commerciaux en place.\n\nAlternativement, le code 3301.90 (autres extraits et essences) pourrait également être considéré si la transformation ne correspond pas exactement à la description du 3301.29.
13	Synthèse	1	SYN-COS001	France	120.00	3402.90	Synthèse chimique du conservateur	5	2024-12-29 10:55:38.89961	2025-01-02 12:13:15.656137	3402.90\n\nCette transformation consiste en la synthèse chimique d'un conservateur à partir de la matière première Cosgard en France. Le code douanier 3402.90 est approprié car il concerne les produits à usage cosmétique ou de toilette, qui incluent les conservateurs utilisés dans les produits cosmétiques. La mention "Synthèse chimique" indique clairement qu'il s'agit d'un produit résultant d'une transformation chimique. L'origine française de la matière première est également un élément important à prendre en compte pour la classification douanière.\n\nAlternatives possibles :\n- 2918.15 : Autres composés organiques contenant des fonctions aromatiques, utilisés principalement comme réactifs pour la synthèse\n- 3808.94 : Produits à usage cosmétique contenant des conservateurs\n\nCependant, le code 3402.90 reste le plus spécifique et approprié pour cette transformation en particulier.
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

