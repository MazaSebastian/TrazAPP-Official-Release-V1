-- Script para aislar y corregir los RPC de Métricas (Multi-tenant SaaS)
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
        -- Usualmente los harvest logs están ligados indirectamente, pero chequeamos auth
        -- Para evitar errores de Schema si harvest_logs no tiene org_id (como indicaba la DB),
        -- vinculamos a través de los dispensary_batches hijos que sí lo tienen.
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
            sum(m.amount) as total -- Usando 'amount' en vez de transaction_value ya que la base usa amount
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

-- 2. Performance by Genetic (Filtrado por org_id)
create or replace function get_genetic_performance(org_id uuid)
returns table (
    genetic_name text,
    total_yield_g numeric,
    harvest_count bigint,
    avg_yield_per_harvest numeric
)
language plpgsql
as $$
begin
    return query
    select 
        d.strain_name,
        sum(h.yield_amount) as total_yield_g,
        count(distinct h.id) as harvest_count,
        round(avg(h.yield_amount), 2) as avg_yield_per_harvest
    from chakra_harvest_logs h
    join chakra_dispensary_batches d on d.harvest_log_id = h.id
    where d.organization_id = org_id
    group by d.strain_name
    order by total_yield_g desc;
end;
$$;

-- 3. Cost Breakdown (Filtrado por org_id)
create or replace function get_cost_breakdown(start_date date, end_date date, org_id uuid)
returns table (
    category text,
    total_amount numeric,
    percentage numeric
)
language plpgsql
as $$
declare 
    total_sum numeric;
begin
    select sum(amount) into total_sum 
    from chakra_expenses 
    where date between start_date and end_date
    and organization_id = org_id;
    
    return query
    select 
        e.category,
        sum(e.amount) as total_amount,
        case when coalesce(total_sum, 0) > 0 then round((sum(e.amount) / total_sum) * 100, 1) else 0 end as percentage
    from chakra_expenses e
    where e.date between start_date and end_date
    and e.organization_id = org_id
    group by e.category
    order by total_amount desc;
end;
$$;
