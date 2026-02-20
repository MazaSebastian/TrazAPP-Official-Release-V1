import React from 'react';
import {
    ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Area
} from 'recharts';
import styled from 'styled-components';

const ChartContainer = styled.div`
  background: rgba(30, 41, 59, 0.6);
  padding: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  height: 400px;
`;

const Title = styled.h3`
  font-size: 1.1rem;
  color: #f8fafc;
  margin-bottom: 1.5rem;
  font-weight: 700;
`;

interface TrendChartProps {
    title: string;
    data: any[];
    dataKey1: string; // e.g. 'total_revenue'
    name1: string;
    color1: string;
    type1?: 'bar' | 'line' | 'area';

    dataKey2?: string; // e.g. 'total_expenses'
    name2?: string;
    color2?: string;
    type2?: 'bar' | 'line' | 'area';

    unit?: string;
}

export const TrendChart: React.FC<TrendChartProps> = ({ title, data, dataKey1, name1, color1, type1 = 'bar', dataKey2, name2, color2, type2 = 'line', unit = '$' }) => {
    return (
        <ChartContainer>
            <Title>{title}</Title>
            <ResponsiveContainer width="100%" height="90%">
                <ComposedChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis
                        dataKey="month"
                        tickFormatter={(val) => ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][val - 1]}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        tickFormatter={(val) => `${unit}${val}`}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', color: '#f8fafc' }}
                        formatter={(value: any) => [`${unit}${Number(value).toLocaleString()}`, '']}
                        itemStyle={{ color: '#f8fafc' }}
                    />
                    <Legend wrapperStyle={{ color: '#cbd5e1' }} />

                    {type1 === 'bar' && <Bar dataKey={dataKey1} name={name1} fill={color1} barSize={20} radius={[4, 4, 0, 0]} />}
                    {type1 === 'line' && <Line type="monotone" dataKey={dataKey1} name={name1} stroke={color1} strokeWidth={3} dot={{ r: 4 }} />}
                    {type1 === 'area' && <Area type="monotone" dataKey={dataKey1} name={name1} fill={color1} stroke={color1} fillOpacity={0.3} />}

                    {dataKey2 && type2 === 'bar' && <Bar dataKey={dataKey2} name={name2} fill={color2} barSize={20} radius={[4, 4, 0, 0]} />}
                    {dataKey2 && type2 === 'line' && <Line type="monotone" dataKey={dataKey2} name={name2} stroke={color2} strokeWidth={3} dot={{ r: 4 }} />}
                    {dataKey2 && type2 === 'area' && <Area type="monotone" dataKey={dataKey2} name={name2} fill={color2} stroke={color2} fillOpacity={0.3} />}

                </ComposedChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
};
