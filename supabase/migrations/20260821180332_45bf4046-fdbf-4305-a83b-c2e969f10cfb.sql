-- The duplicate slug 'restyle' exists for two different barbershops.
-- The screenshot showed 'RESTYLE' in Itapetinga, which corresponds to ID 8b4c5a22-08fc-48d4-8ef3-5aed98bd9283.
-- Service "barba" for this shop: d2516bea-138b-43c7-9da7-7aa3fe4b25ae
-- Professional for this shop: 8bd84475-20bc-4370-8936-125509bc1d1a (name: mhhh)

-- Let's create the link for THIS specific shop (Itapetinga/RESTYLE)
INSERT INTO public.professional_services (professional_id, service_id, barbershop_id)
VALUES ('8bd84475-20bc-4370-8936-125509bc1d1a', 'd2516bea-138b-43c7-9da7-7aa3fe4b25ae', '8b4c5a22-08fc-48d4-8ef3-5aed98bd9283')
ON CONFLICT DO NOTHING;
