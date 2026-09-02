create table if not exists public.product_reviews (
    id bigint generated always as identity primary key,
    product_id bigint not null references public.products(id) on delete cascade,
    customer_name text not null check (char_length(customer_name) between 2 and 60),
    customer_email text not null check (char_length(customer_email) between 5 and 255),
    rating smallint not null check (rating between 1 and 5),
    comment text not null check (char_length(comment) between 10 and 1000),
    status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
    created_at timestamptz not null default now(), reviewed_at timestamptz
);
create unique index if not exists product_reviews_one_per_email on public.product_reviews (product_id, lower(customer_email));
create index if not exists product_reviews_public_lookup on public.product_reviews (product_id, status, created_at desc);
alter table public.product_reviews enable row level security;
