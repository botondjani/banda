-- pg_net ne a public sémában legyen (advisor: extension_in_public). A net.* függvények maradnak.
drop extension if exists pg_net;
create extension pg_net with schema extensions;
