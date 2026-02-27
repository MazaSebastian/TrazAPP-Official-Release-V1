import React, { useState } from 'react';
import styled from 'styled-components';
import { supabase } from '../../services/supabaseClient';
import { CustomSelect } from '../../components/CustomSelect';
import { inviteService } from '../../services/inviteService';
import { FaCheck, FaCopy } from 'react-icons/fa';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  backdrop-filter: blur(8px);
`;

const ModalContent = styled.div`
  background: rgba(17, 24, 39, 0.7); /* Dark translucent background */
  padding: 2.5rem;
  border-radius: 16px;
  width: 500px;
  max-width: 90%;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  position: relative;
  animation: slideIn 0.3s ease-out;

  @keyframes slideIn {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
`;

const Title = styled.h2`
  margin-top: 0;
  color: #f8fafc;
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  text-align: center;
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #94a3b8;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  background: rgba(30, 41, 59, 0.5);
  color: #f8fafc;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: rgba(168, 85, 247, 0.5);
    box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.1);
  }
  
  &::placeholder {
    color: #64748b;
  }
`;



const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  border: ${props => props.variant === 'primary' ? '1px solid rgba(168, 85, 247, 0.5)' : '1px solid rgba(255, 255, 255, 0.2)'};
  background: ${props => props.variant === 'primary' ? 'rgba(168, 85, 247, 0.2)' : 'transparent'};
  color: ${props => props.variant === 'primary' ? '#d8b4fe' : '#cbd5e1'};
  backdrop-filter: blur(8px);
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: ${props => props.variant === 'primary' ? 'rgba(168, 85, 247, 0.3)' : 'rgba(255, 255, 255, 0.05)'};
    transform: translateY(-1px);
    box-shadow: 0 4px 6px rgba(0,0,0,0.2);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

interface CreateOrgModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export const CreateOrgModal: React.FC<CreateOrgModalProps> = ({ onClose, onSuccess }) => {
    // New fields
    const [orgNameText, setOrgNameText] = useState('');
    const [email, setEmail] = useState('');
    const [plan, setPlan] = useState('individual');

    // UI state
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [inviteLink, setInviteLink] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const orgName = orgNameText;

            const { data, error } = await supabase
                .from('organizations')
                .insert([{
                    name: orgName,
                    owner_email: email,
                    plan: plan,
                    slug: orgName.toLowerCase().replace(/\s+/g, '-'),
                    status: 'pending',
                }])
                .select()
                .single();

            if (error) throw error;

            // Create Invite
            if (data && data.id) {
                const invite = await inviteService.createInvite(data.id, email, 'owner');
                if (invite) {
                    // Forzar el uso del dominio público si el admin crea orgs desde su ambiente de desarrollo local.
                    let baseOrigin = window.location.origin;
                    if (baseOrigin.includes('localhost') || baseOrigin.includes('127.0.0.1')) {
                        baseOrigin = 'https://software.trazapp.ar'; // Dominio oficial de producción
                    }
                    const link = `${baseOrigin}/register?token=${invite.token}`;

                    // Invocar el envío de Email automático (Resend)
                    const { error: invokeError } = await supabase.functions.invoke('send-invite', {
                        body: { email, inviteLink: link, orgName },
                    });

                    if (invokeError) {
                        console.error('Error enviando correo:', invokeError);
                        // A pesar del error en el correo, mostramos el link manualmente para no bloquear al admin
                    }

                    setInviteLink(link);
                    return; // Don't close, show link
                }
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Error al crear la organización.');
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (inviteLink) {
            navigator.clipboard.writeText(inviteLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (inviteLink) {
        return (
            <ModalOverlay onClick={onClose}>
                <ModalContent onClick={e => e.stopPropagation()}>
                    <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                        <div style={{ background: 'rgba(74, 222, 128, 0.2)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', border: '1px solid rgba(74, 222, 128, 0.5)' }}>
                            <FaCheck size={30} color="#4ade80" />
                        </div>
                        <Title>¡Invitación Enviada!</Title>
                        <p style={{ color: '#e2e8f0', marginBottom: '1rem', fontSize: '1.1rem' }}>
                            La organización <strong style={{ color: '#4ade80' }}>{orgNameText}</strong> ha sido creada.
                        </p>
                        <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
                            Se ha enviado un correo electrónico a <strong>{email}</strong> con su enlace de acceso seguro.
                        </p>

                        <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                            <Label style={{ textAlign: 'left', marginBottom: '0.5rem' }}>Para uso de emergencia (respaldo):</Label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <Input value={inviteLink} readOnly />
                                <Button onClick={copyToClipboard} variant="secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
                                    {copied ? <FaCheck color="#4ade80" /> : <FaCopy />}
                                </Button>
                            </div>
                            <small style={{ display: 'block', textAlign: 'left', marginTop: '0.5rem', color: '#64748b' }}>
                                Usa este enlace manual si el cliente reporta no haber recibido el correo electrónico.
                            </small>
                        </div>

                        <Button variant="primary" onClick={() => { onSuccess(); onClose(); }} style={{ width: '100%' }}>
                            Finalizar
                        </Button>
                    </div>
                </ModalContent>
            </ModalOverlay>
        );
    }

    return (
        <ModalOverlay onClick={onClose}>
            <ModalContent onClick={e => e.stopPropagation()}>
                <Title>Nueva Organización</Title>
                <form onSubmit={handleSubmit}>
                    <FormGroup>
                        <Label>Plan</Label>
                        <CustomSelect
                            value={plan}
                            onChange={setPlan}
                            options={[
                                { value: 'individual', label: 'Individual' },
                                { value: 'equipo', label: 'Equipo' },
                                { value: 'ong', label: 'ONG' }
                            ]}
                        />
                    </FormGroup>

                    <FormGroup>
                        <Label>{plan === 'ong' ? 'Nombre de la ONG' : 'Nombre del Cliente'}</Label>
                        <Input
                            value={orgNameText}
                            onChange={e => setOrgNameText(e.target.value)}
                            placeholder={plan === 'ong' ? "Ej: Asociación Cannábica..." : "Ej: Juan Pérez"}
                            required
                        />
                    </FormGroup>

                    <FormGroup>
                        <Label>E-mail del Cliente</Label>
                        <Input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="cliente@email.com"
                            required
                        />
                    </FormGroup>

                    <div style={{ background: 'rgba(74, 222, 128, 0.1)', padding: '0.75rem', borderRadius: '4px', fontSize: '0.85rem', color: '#86efac', borderLeft: '4px solid #4ade80', marginBottom: '1.5rem' }}>
                        Nota: La organización se creará en estado <strong>PENDIENTE</strong> hasta que el cliente complete su registro.
                    </div>

                    {error && <div style={{ color: '#f87171', marginBottom: '1rem', fontSize: '0.9rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>{error}</div>}

                    <ButtonGroup>
                        <Button type="button" variant="secondary" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" variant="primary" disabled={isLoading}>
                            {isLoading ? 'Generando...' : 'Generar Invitación'}
                        </Button>
                    </ButtonGroup>
                </form>
            </ModalContent>
        </ModalOverlay>
    );
};
