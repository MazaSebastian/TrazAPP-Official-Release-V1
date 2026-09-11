import React, { useState } from 'react';
import styled from 'styled-components';
import { supabase } from '../../services/supabaseClient';
import { CustomSelect } from '../../components/CustomSelect';
import { inviteService } from '../../services/inviteService';
import { 
    CheckCircle2, 
    Copy, 
    Check, 
    Building2, 
    Sparkles, 
    X as LucideX
} from 'lucide-react';
import { ShadcnButton } from '../../components/ui/Button';

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  backdrop-filter: blur(12px);
  padding: 1rem;
  animation: fadeIn 0.2s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const ModalContent = styled.div`
  background: rgba(15, 23, 42, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 2.25rem;
  border-radius: 1.25rem;
  width: 520px;
  max-width: 95%;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
  position: relative;
  animation: slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);

  @keyframes slideIn {
    from { transform: translateY(16px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
`;

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.75rem;
`;

const Title = styled.h2`
  margin: 0;
  color: #f8fafc;
  font-size: 1.35rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.65rem;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.45rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  &:hover {
    color: #f1f5f9;
    background: rgba(255, 255, 255, 0.08);
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1.25rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.45rem;
  font-weight: 600;
  font-size: 0.85rem;
  color: #cbd5e1;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 0.95rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.65rem;
  background: rgba(30, 41, 59, 0.5);
  color: #f8fafc;
  font-size: 0.95rem;
  box-sizing: border-box;
  transition: all 0.2s;
  
  &:focus {
    outline: none;
    border-color: rgba(168, 85, 247, 0.5);
    box-shadow: 0 0 0 2px rgba(168, 85, 247, 0.2);
  }
  
  &::placeholder {
    color: #64748b;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 2rem;
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
                    let baseOrigin = window.location.origin;
                    if (baseOrigin.includes('localhost') || baseOrigin.includes('127.0.0.1')) {
                        baseOrigin = 'https://software.trazapp.ar';
                    }
                    const link = `${baseOrigin}/register?token=${invite.token}`;

                    const { error: invokeError } = await supabase.functions.invoke('send-invite', {
                        body: { email, inviteLink: link, orgName },
                    });

                    if (invokeError) {
                        console.error('Error enviando correo:', invokeError);
                    }

                    setInviteLink(link);
                    return;
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
                    <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                        <div style={{ 
                            background: 'rgba(16, 185, 129, 0.15)', 
                            width: '64px', 
                            height: '64px', 
                            borderRadius: '50%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            margin: '0 auto 1.25rem', 
                            border: '1px solid rgba(16, 185, 129, 0.3)' 
                        }}>
                            <CheckCircle2 size={32} color="#34d399" />
                        </div>
                        <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                            ¡Invitación Generada!
                        </h3>
                        <p style={{ color: '#cbd5e1', marginBottom: '0.5rem', fontSize: '1rem', lineHeight: 1.5 }}>
                            La organización <strong style={{ color: '#34d399' }}>{orgNameText}</strong> ha sido creada.
                        </p>
                        <p style={{ color: '#94a3b8', marginBottom: '1.75rem', fontSize: '0.9rem' }}>
                            Se despachó un e-mail a <strong>{email}</strong> con su enlace seguro.
                        </p>

                        <div style={{ 
                            background: 'rgba(30, 41, 59, 0.5)', 
                            padding: '1.25rem', 
                            borderRadius: '0.75rem', 
                            marginBottom: '1.75rem', 
                            border: '1px solid rgba(255, 255, 255, 0.08)' 
                        }}>
                            <Label style={{ textAlign: 'left', marginBottom: '0.5rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                                Enlace de acceso directo (respaldo manual):
                            </Label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <Input value={inviteLink} readOnly style={{ fontSize: '0.85rem' }} />
                                <ShadcnButton 
                                    type="button"
                                    onClick={copyToClipboard} 
                                    variant="secondary" 
                                    size="icon"
                                    title="Copiar enlace"
                                >
                                    {copied ? <Check size={16} color="#34d399" /> : <Copy size={16} />}
                                </ShadcnButton>
                            </div>
                            <small style={{ display: 'block', textAlign: 'left', marginTop: '0.5rem', color: '#64748b', fontSize: '0.75rem' }}>
                                Puedes copiar este enlace y enviarlo directamente si el cliente reporta no haber recibido el correo.
                            </small>
                        </div>

                        <ShadcnButton 
                            variant="default" 
                            onClick={() => { onSuccess(); onClose(); }} 
                            style={{ width: '100%' }}
                        >
                            Finalizar y Cerrar
                        </ShadcnButton>
                    </div>
                </ModalContent>
            </ModalOverlay>
        );
    }

    return (
        <ModalOverlay onClick={onClose}>
            <ModalContent onClick={e => e.stopPropagation()}>
                <HeaderRow>
                    <Title>
                        <div style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '0.6rem',
                            background: 'rgba(168, 85, 247, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid rgba(168, 85, 247, 0.3)'
                        }}>
                            <Building2 size={20} color="#c084fc" />
                        </div>
                        Nueva Organización
                    </Title>
                    <CloseButton onClick={onClose} aria-label="Cerrar">
                        <LucideX size={20} />
                    </CloseButton>
                </HeaderRow>

                <form onSubmit={handleSubmit}>
                    <FormGroup>
                        <Label>Plan de Suscripción</Label>
                        <CustomSelect
                            value={plan}
                            onChange={setPlan}
                            options={[
                                { value: 'demo', label: 'Demo (15 Días)' },
                                { value: 'individual', label: 'Individual' },
                                { value: 'equipo', label: 'Equipo' },
                                { value: 'ong', label: 'ONG' },
                                { value: 'trazapp', label: 'Plan TrazAPP' }
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

                    <div style={{ 
                        background: 'rgba(168, 85, 247, 0.08)', 
                        padding: '0.85rem 1rem', 
                        borderRadius: '0.65rem', 
                        fontSize: '0.82rem', 
                        color: '#d8b4fe', 
                        border: '1px solid rgba(168, 85, 247, 0.25)', 
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem'
                    }}>
                        <Sparkles size={18} style={{ flexShrink: 0 }} />
                        <span>La organización se creará en estado <strong>PENDIENTE</strong> hasta que el cliente complete su registro.</span>
                    </div>

                    {error && (
                        <div style={{ 
                            color: '#f87171', 
                            marginBottom: '1rem', 
                            fontSize: '0.88rem', 
                            background: 'rgba(239, 68, 68, 0.1)', 
                            padding: '0.75rem', 
                            borderRadius: '0.5rem', 
                            border: '1px solid rgba(239, 68, 68, 0.3)' 
                        }}>
                            {error}
                        </div>
                    )}

                    <ButtonGroup>
                        <ShadcnButton type="button" variant="secondary" onClick={onClose}>
                            Cancelar
                        </ShadcnButton>
                        <ShadcnButton type="submit" variant="default" isLoading={isLoading}>
                            Generar Invitación
                        </ShadcnButton>
                    </ButtonGroup>
                </form>
            </ModalContent>
        </ModalOverlay>
    );
};
