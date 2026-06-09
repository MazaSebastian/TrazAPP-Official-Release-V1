import React, { useRef, useState, useEffect } from 'react';
import { organizationService } from '../../services/organizationService';
import { LandingArticle } from '../../types';
import styled, { createGlobalStyle } from 'styled-components';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenantResolver } from '../../hooks/useTenantResolver';
import { motion, useMotionValue, useSpring, Variants, useMotionTemplate, useTransform } from 'framer-motion';
import { FaArrowRight, FaLock, FaUsers, FaLeaf, FaShoppingBag } from 'react-icons/fa';

// --- Inyectamos Fuentes Brutalistas y Globales ---
const GlobalBrutalistStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Caveat:wght@700&display=swap');

  html {
    scroll-behavior: smooth;
  }
`;

// -- Layout Container --
const PageWrapper = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: #111111; /* Off-black */
  color: #E8E9E1; /* Off-white */
  
  /* Textura de ruido sutil */
  &::before {
    content: "";
    position: fixed;
    top: 0; left: 0; width: 100vw; height: 100vh;
    opacity: 0.04;
    z-index: 9999;
    pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  }

  @media (max-width: 1024px) {
    flex-direction: column;
  }
`;

// -- Sidebar (Left) --
const Sidebar = styled.aside`
  width: 320px;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  background-color: var(--primary-color, #1FE074);
  color: #111;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  z-index: 100;
  border-right: 2px solid #000;

  @media (max-width: 1024px) {
    width: 100%;
    height: auto;
    position: relative;
    border-right: none;
    border-bottom: 2px solid #000;
  }
`;

const BrandBlock = styled.div`
  margin-bottom: 4rem;
  
  img {
    max-width: 120px;
    margin-bottom: 1rem;
  }
  
  h1 {
    font-family: 'Bebas Neue', impact, sans-serif;
    font-size: 4rem;
    line-height: 0.9;
    margin: 0;
    text-transform: uppercase;
  }

  .sub-brand {
    font-family: 'Caveat', cursive;
    font-size: 1.5rem;
    transform: rotate(-5deg);
    display: inline-block;
    margin-top: -10px;
  }
`;

const NavMenu = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  flex-grow: 1;

  a {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 2.5rem;
    color: #111;
    text-decoration: none;
    text-transform: uppercase;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px dashed rgba(0,0,0,0.2);
    padding-bottom: 0.5rem;
    transition: transform 0.2s;

    &:hover {
      transform: translateX(10px);
      border-bottom-color: rgba(0,0,0,0.8);
    }

    svg {
      background: #111;
      color: var(--primary-color, #1FE074);
      border-radius: 50%;
      padding: 0.4rem;
      font-size: 1.8rem;
    }
  }

  @media (max-width: 1024px) {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 1rem;
    a {
      font-size: 1.5rem;
      border-bottom: none;
      svg { display: none; }
    }
  }
`;

// -- Botón Magnético Reutilizable --
const MagneticButton = ({ children, onClick, style = {}, dark = false }: any) => {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 15, mass: 0.1 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 15, mass: 0.1 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const center = { x: left + width / 2, y: top + height / 2 };
    x.set((e.clientX - center.x) * 0.2);
    y.set((e.clientY - center.y) * 0.2);
  };

  const handleMouseLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.div style={{ x: mouseXSpring, y: mouseYSpring, display: 'inline-block' }} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      <ActionBtn ref={ref} onClick={onClick} style={style} $dark={dark} whileTap={{ scale: 0.95 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
        {children}
      </ActionBtn>
    </motion.div>
  );
};

const ActionBtn = styled(motion.button)<{ $dark?: boolean }>`
  background: ${props => props.$dark ? '#111' : '#E8E9E1'};
  color: ${props => props.$dark ? '#E8E9E1' : '#111'};
  border: 2px solid #111;
  padding: 0.8rem 1.5rem;
  border-radius: 0.5rem;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.8rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 4px 4px 0px #111;
  transition: all 0.2s;
  
  &:hover {
    box-shadow: 2px 2px 0px #111;
    transform: translate(2px, 2px);
  }
  
  svg { font-size: 1.2rem; }
`;

// -- Main Content Area (Right) --
const MainContent = styled.main`
  margin-left: 320px;
  width: calc(100% - 320px);
  min-height: 100vh;
  padding: 4rem;
  overflow-x: hidden;

  @media (max-width: 1024px) {
    margin-left: 0;
    width: 100%;
    padding: 2rem;
  }
`;

// -- Secciones --
const Section = styled(motion.section)`
  min-height: 90vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  margin-bottom: 4rem;
`;

// -- Tipografía Brutalista --
const MassiveText = styled.h2`
  font-family: 'Bebas Neue', sans-serif;
  font-size: clamp(4rem, 12vw, 11rem);
  line-height: 0.85;
  color: #E8E9E1;
  margin: 0;
  text-transform: uppercase;
  
  span.highlight {
    color: var(--primary-color, #1FE074);
  }
`;

const HandText = styled.div`
  font-family: 'Caveat', cursive;
  font-size: clamp(1.5rem, 3vw, 2.5rem);
  color: var(--primary-color, #1FE074);
  transform: rotate(-3deg);
  margin-top: 2rem;
  max-width: 600px;
  line-height: 1.2;
`;

// -- Elementos Interactivos Parallax & Spotlight --
const SpotlightOverlay = ({ mouseX, mouseY }: { mouseX: any, mouseY: any }) => {
  const bg = useMotionTemplate`radial-gradient(800px circle at ${mouseX}px ${mouseY}px, rgba(var(--primary-color-rgb, 31, 224, 116), 0.12), transparent 80%)`;
  return <motion.div style={{ background: bg, position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />;
};

const FloatingElement = ({ mouseX, mouseY, intensity, size, top, left, right, bottom, rotate, delay, children }: any) => {
  const moveX = useTransform(mouseX, [0, typeof window !== 'undefined' ? window.innerWidth : 1000], [intensity, -intensity]);
  const moveY = useTransform(mouseY, [0, typeof window !== 'undefined' ? window.innerHeight : 1000], [intensity, -intensity]);
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, rotate: rotate - 20 }}
      animate={{ opacity: 1, scale: 1, rotate }}
      transition={{ delay, duration: 1.5, type: 'spring', bounce: 0.4 }}
      style={{
        position: 'absolute',
        top, left, right, bottom,
        x: moveX, y: moveY,
        width: size, height: size,
        zIndex: 5,
        pointerEvents: 'none'
      }}
    >
      {children}
    </motion.div>
  );
};

// -- Elementos Dibujados a Mano (SVGs inlines) --
const HandDrawnCircle = styled.svg`
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 120%; height: 140%;
  pointer-events: none;
  overflow: visible;

  path {
    fill: none;
    stroke: var(--primary-color, #1FE074);
    stroke-width: 4;
    stroke-linecap: round;
    stroke-dasharray: 1000;
    stroke-dashoffset: 1000;
    animation: drawCircle 1.5s ease forwards;
    animation-delay: 0.5s;
  }

  @keyframes drawCircle {
    to { stroke-dashoffset: 0; }
  }
`;

const HandArrow = () => (
  <svg width="60" height="80" viewBox="0 0 60 80" style={{ margin: '1rem 0', transform: 'rotate(10deg)' }}>
    <path d="M10,10 Q40,30 30,70" fill="none" stroke="var(--primary-color, #1FE074)" strokeWidth="3" strokeLinecap="round" />
    <path d="M20,60 L30,70 L40,55" fill="none" stroke="var(--primary-color, #1FE074)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// -- Steps Layout --
const StepsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3rem;
  margin-top: 4rem;
  align-items: flex-end;
  padding-right: 10%;

  @media (max-width: 768px) {
    align-items: flex-start;
    padding-right: 0;
  }
`;

const StepItem = styled(motion.div)`
  text-align: right;
  max-width: 400px;

  @media (max-width: 768px) {
    text-align: left;
  }

  .step-num {
    font-family: 'Bebas Neue', sans-serif;
    color: var(--primary-color, #1FE074);
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
  }
  
  .step-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 3rem;
    line-height: 1;
    color: #E8E9E1;
    margin: 0;
  }
`;

// -- Motion Variants --
const staggerVariant: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.2 } }
};

const itemVariant: Variants = {
  hidden: { opacity: 0, x: -50 },
  show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 100 } }
};

const rightItemVariant: Variants = {
  hidden: { opacity: 0, x: 50 },
  show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 100 } }
};

export const TenantLanding: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const { tenant, isLoading } = useTenantResolver(slug);
    const navigate = useNavigate();
    
    const [articles, setArticles] = useState<LandingArticle[]>([]);

    useEffect(() => {
        if (tenant?.id) {
            organizationService.getLandingArticles(tenant.id).then(data => {
                setArticles(data);
            });
        }
    }, [tenant?.id]);
    
    // Spotlight and Parallax tracking
    const mouseX = useMotionValue(typeof window !== 'undefined' ? window.innerWidth / 2 : 0);
    const mouseY = useMotionValue(typeof window !== 'undefined' ? window.innerHeight / 2 : 0);

    const handleMouseMove = (e: React.MouseEvent) => {
        mouseX.set(e.clientX);
        mouseY.set(e.clientY);
    };

    if (isLoading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111', color: '#fff' }}>Cargando experiencia...</div>;
    if (!tenant) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111', color: '#ef4444' }}>Portal de organización no encontrado.</div>;

    const handleLoginClick = () => {
        const hostname = window.location.hostname.toLowerCase();
        const isMainDomain = 
            hostname === 'localhost' || 
            hostname === '127.0.0.1' ||
            hostname === '[::1]' ||
            hostname.endsWith('trazapp.com') || 
            hostname.endsWith('trazapp.ar') || 
            hostname.endsWith('vercel.app') ||
            /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostname);
        const isCustomDomain = !isMainDomain;
        if (isCustomDomain) {
            navigate('/login');
        } else {
            navigate(`/${tenant.slug}/login`);
        }
    };

    const setts = tenant.landing_settings || {};
    const titleText = setts.heroTitle || 'WELCOME TO';
    const subtitleText = setts.heroSubtitle || 'Exclusive botanical tracking & community platform.';
    const aboutText = setts.aboutText || "Let's take good care of your botanical journey, right?!";
    const portalSubtitle = setts.portalSubtitle || "Official Portal";
    
    const gamePlanTitle = setts.gamePlanTitle || "LET'S KEEP YOUR GEAR ALIVE WITH YOUR GAME PLAN";
    const step1Title = setts.step1Title || "BECOME A MEMBER";
    const step1Text = setts.step1Text || "Get your exclusive credentials.";
    const step2Title = setts.step2Title || "TRACK YOUR STOCK";
    const step2Text = setts.step2Text || "Use TrazAPP to manage your botanical needs securely.";
    const step3Title = setts.step3Title || "ACCESS THE SHOP";
    const step3Text = setts.step3Text || "Exclusive dispensary for verified members only.";

    const catalogTitle = setts.catalogTitle || "CATÁLOGO DEL MES";
    const catalogSubtitle = setts.catalogSubtitle || "Check out our latest products.";

    const contactTitle = setts.contactTitle || "Contact";
    const contactText = setts.contactText || "Need help? Reach out to us. We love to talk about gear-saving and tracking!";
    const contactEmail = setts.contactEmail || `hello@${tenant.slug}.com`;
    const contactPhone = setts.contactPhone || "+54 9 11 1234 5678";

    return (
        <PageWrapper onMouseMove={handleMouseMove}>
            <GlobalBrutalistStyle />
            <SpotlightOverlay mouseX={mouseX} mouseY={mouseY} />
            
            <Sidebar>
                <BrandBlock>
                    {tenant.logo_url && <img src={tenant.logo_url} alt="Logo" />}
                    <h1>{tenant.name}</h1>
                    <span className="sub-brand">{portalSubtitle}</span>
                </BrandBlock>

                <NavMenu>
                    <a href="#intro">Intro <FaArrowRight /></a>
                    <a href="#game-plan">Game Plan <FaArrowRight /></a>
                    <a href="#catalog">Catálogo <FaArrowRight /></a>
                    <a href="#contact">Contact <FaArrowRight /></a>
                </NavMenu>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
                    <MagneticButton dark onClick={handleLoginClick}>
                        <FaLock /> Ingresar
                    </MagneticButton>
                    <MagneticButton onClick={() => navigate(`/${tenant.slug}/apply`)}>
                        <FaUsers /> Ser Socio
                    </MagneticButton>
                </div>
            </Sidebar>

            <MainContent>
                {/* SECTION: INTRO */}
                <Section id="intro" variants={staggerVariant} initial="hidden" whileInView="show" viewport={{ once: true }}>
                    
                    {/* Floating Parallax Figures */}
                    <FloatingElement mouseX={mouseX} mouseY={mouseY} intensity={40} size="150px" top="10%" right="5%" rotate={15} delay={0.3}>
                        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M50 0L55 40L95 45L55 50L50 90L45 50L5 45L45 40L50 0Z" fill="var(--primary-color, #1FE074)" />
                        </svg>
                    </FloatingElement>
                    
                    <FloatingElement mouseX={mouseX} mouseY={mouseY} intensity={-60} size="200px" bottom="-10%" right="20%" rotate={-10} delay={0.5}>
                        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="50" cy="50" r="45" stroke="var(--primary-color, #1FE074)" strokeWidth="4" strokeDasharray="10 10" />
                            <text x="50" y="55" fontFamily="Bebas Neue" fontSize="30" fill="var(--primary-color, #1FE074)" textAnchor="middle">100%</text>
                        </svg>
                    </FloatingElement>

                    <motion.div variants={itemVariant} style={{ position: 'relative', zIndex: 10 }}>
                        <MassiveText>{titleText}</MassiveText>
                        <MassiveText className="highlight" style={{ position: 'relative', display: 'inline-block' }}>
                            {tenant.name}
                            <HandDrawnCircle viewBox="0 0 200 100" preserveAspectRatio="none">
                                <path d="M10,50 Q40,10 100,10 T190,50 Q160,90 100,90 T10,50 Z" />
                            </HandDrawnCircle>
                        </MassiveText>
                    </motion.div>
                    
                    <motion.div variants={itemVariant} style={{ position: 'relative', zIndex: 10 }}>
                        <HandText>
                            * {subtitleText} <br/> 
                            {aboutText}
                        </HandText>
                    </motion.div>
                </Section>

                {/* SECTION: GAME PLAN */}
                <Section id="game-plan" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center' }}>
                    <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={itemVariant}>
                        <MassiveText style={{ fontSize: 'clamp(3rem, 8vw, 8rem)', whiteSpace: 'pre-line' }}>
                            {gamePlanTitle}
                        </MassiveText>
                    </motion.div>

                    <StepsContainer as={motion.div} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} variants={staggerVariant}>
                        <StepItem variants={rightItemVariant}>
                            <div className="step-num">PASO #1</div>
                            <h3 className="step-title">{step1Title}</h3>
                            <HandText style={{ marginTop: '0.5rem', fontSize: '1.2rem', textAlign: 'right' }}>{step1Text}</HandText>
                        </StepItem>
                        
                        <HandArrow />

                        <StepItem variants={rightItemVariant}>
                            <div className="step-num">PASO #2</div>
                            <h3 className="step-title">{step2Title}</h3>
                            <HandText style={{ marginTop: '0.5rem', fontSize: '1.2rem', textAlign: 'right' }}>{step2Text}</HandText>
                        </StepItem>
                        
                        <HandArrow />

                        <StepItem variants={rightItemVariant}>
                            <div className="step-num">PASO #3</div>
                            <h3 className="step-title">{step3Title}</h3>
                            <HandText style={{ marginTop: '0.5rem', fontSize: '1.2rem', textAlign: 'right' }}>{step3Text}</HandText>
                        </StepItem>
                    </StepsContainer>
                </Section>

                {/* SECTION: CATALOG */}
                <Section id="catalog" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', borderTop: '2px dashed rgba(255,255,255,0.1)', paddingTop: '4rem' }}>
                    <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={itemVariant}>
                        <h2 style={{ fontFamily: 'Bebas Neue', fontSize: 'clamp(3rem, 8vw, 6rem)', margin: 0, color: 'var(--primary-color)' }}>{catalogTitle}</h2>
                        <HandText style={{ marginTop: '1rem', color: '#E8E9E1', fontSize: '1.5rem' }}>{catalogSubtitle}</HandText>
                    </motion.div>

                    <motion.div 
                        variants={staggerVariant} 
                        initial="hidden" 
                        whileInView="show" 
                        viewport={{ once: true }}
                        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '2rem' }}
                    >
                        {articles.length > 0 ? (
                            articles.map((article, idx) => (
                                <motion.div key={article.id} variants={itemVariant} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '2rem', borderRadius: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', overflow: 'hidden' }}>
                                    {idx === 0 && <div style={{ position: 'absolute', top: 0, right: 0, background: 'var(--primary-color)', color: '#111', fontFamily: 'Bebas Neue', padding: '0.5rem 1rem', fontSize: '1.2rem' }}>NEW</div>}
                                    
                                    <div style={{ height: '200px', background: 'rgba(0,0,0,0.5)', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                        {article.image_url ? (
                                            <img src={article.image_url} alt={article.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                                        )}
                                    </div>
                                    <h3 style={{ fontFamily: 'Bebas Neue', fontSize: '2rem', margin: 0 }}>{article.title}</h3>
                                    <HandText>{article.description}</HandText>
                                    <MagneticButton dark style={{ width: '100%', marginTop: 'auto' }} onClick={() => alert('Ver más detalles o reservar')}>Ver Más <FaArrowRight /></MagneticButton>
                                </motion.div>
                            ))
                        ) : (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '1rem' }}>
                                <HandText style={{ color: '#94a3b8' }}>Aún no hay hitos o artículos publicados en nuestro portfolio.</HandText>
                            </div>
                        )}
                    </motion.div>
                </Section>

                {/* SECTION: CONTACT */}
                <Section id="contact" style={{ minHeight: '50vh', borderTop: '2px dashed rgba(255,255,255,0.1)', paddingTop: '4rem' }}>
                    <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={itemVariant}>
                        <h2 style={{ fontFamily: 'Bebas Neue', fontSize: '4rem', margin: 0, color: 'var(--primary-color)' }}>{contactTitle}</h2>
                        <HandText style={{ marginTop: '1rem', color: '#E8E9E1' }}>
                            {contactText}
                        </HandText>
                        <div style={{ display: 'flex', gap: '2rem', marginTop: '3rem', fontFamily: 'Bebas Neue', fontSize: '2rem', flexWrap: 'wrap' }}>
                            <div style={{ borderBottom: '4px solid var(--primary-color)' }}>{contactEmail}</div>
                            <div style={{ borderBottom: '4px solid var(--primary-color)' }}>{contactPhone}</div>
                        </div>
                    </motion.div>
                </Section>

            </MainContent>
        </PageWrapper>
    );
};
