-- Parche para corregir el cálculo de Ingresos Financieros en TrazAPP
-- Por favor ejecuta este script en el SQL Editor de Supabase.

-- 1. Get Monthly Financials & Yields (Filtrado por org_id)
create or replace function get_monthly_metrics(query_year int, org_id uuid)
returns table (
    month int,
    total_yield numeric,
    total_expenses numeric,
    total_revenue numeric
)
language plpgsql
as $$
begin
    return query
    with months as (
        select generate_series(1, 12) as m
    ),
    yields as (
        select 
            extract(month from created_at)::int as m, 
            sum(yield_amount) as amount
        from chakra_harvest_logs
        where extract(year from created_at) = query_year
        and id in (select harvest_log_id from chakra_dispensary_batches where organization_id = org_id)
        group by 1
    ),
    expenses as (
        select 
            extract(month from date)::int as m, 
            sum(amount) as total
        from chakra_expenses
        where extract(year from date) = query_year
        and organization_id = org_id
        group by 1
    ),
    revenue as (
        select 
            extract(month from m.created_at)::int as m, 
            sum(m.transaction_value) as total -- CORREGIDO: Mide el dinero, no los gramos retirados (-amount)
        from chakra_dispensary_movements m
        join chakra_dispensary_batches b on b.id = m.batch_id
        where extract(year from m.created_at) = query_year
        and m.type = 'dispense' 
        and b.organization_id = org_id
        group by 1
    )
    select 
        months.m,
        coalesce(yields.amount, 0) as total_yield,
        coalesce(expenses.total, 0) as total_expenses,
        coalesce(revenue.total, 0) as total_revenue
    from months
    left join yields on months.m = yields.m
    left join expenses on months.m = expenses.m
    left join revenue on months.m = revenue.m
    order by months.m;
end;
$$;
