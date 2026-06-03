import { useState } from 'react'
import { CheckCircle, Copy, ExternalLink, Zap, Database, Key, Terminal } from 'lucide-react'
import { useThemeColors } from '../context/ThemeContext'

const SQL = `-- Run this in Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste → Run

create table if not exists propertyops_profiles (
  id          uuid references auth.users on delete cascade primary key,
  email       text,
  full_name   text,
  role        text default 'agency_owner',
  branch      text default 'All Branches',
  agency_name text default 'My Agency',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table propertyops_profiles enable row level security;

create policy "Users can view own profile"
  on propertyops_profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on propertyops_profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on propertyops_profiles for insert
  with check (auth.uid() = id);

-- Auto-create profile on user sign up
create or replace function handle_propertyops_signup()
returns trigger as $$
begin
  insert into propertyops_profiles (id, email, full_name, role, agency_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'agency_owner'),
    coalesce(new.raw_user_meta_data->>'agency_name', 'My Agency')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_propertyops_user_created on auth.users;
create trigger on_propertyops_user_created
  after insert on auth.users
  for each row execute function handle_propertyops_signup();`

const ENV_CONTENT = `# PropertyOps AI — .env file
# Located at: /Users/aurimasjuodeika/Desktop/Claude/PropertyOpsAI/.env

VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...YOUR-ANON-KEY`

const STEPS = [
  {
    n: 1, icon: ExternalLink, title: 'Create a Supabase project',
    desc: 'Go to supabase.com and create a free project. Choose a region close to the UK.',
    action: { label: 'Open supabase.com', url: 'https://supabase.com/dashboard/new/new-project' },
  },
  {
    n: 2, icon: Key, title: 'Copy your API credentials',
    desc: 'In your project: Settings → API → copy the Project URL and anon/public key.',
    action: null,
  },
  {
    n: 3, icon: Terminal, title: 'Add credentials to .env',
    desc: 'Open the .env file in the PropertyOpsAI folder and paste in your credentials.',
    code: ENV_CONTENT,
  },
  {
    n: 4, icon: Database, title: 'Create the profiles table',
    desc: 'In Supabase dashboard → SQL Editor → paste and run this SQL to create the user profiles table with RLS policies.',
    code: SQL,
  },
  {
    n: 5, icon: Zap, title: 'Restart the dev server',
    desc: 'Stop the dev server (Ctrl+C) and run npm run dev again to pick up the new credentials.',
    code: 'npm run dev',
  },
]

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy}
      style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#10b981' : '#94a3b8', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', padding: '3px 7px', borderRadius: 5, transition: 'color 0.15s' }}>
      {copied ? <><CheckCircle size={13} /> Copied!</> : <><Copy size={13} /> Copy</>}
    </button>
  )
}

export default function SupabaseSetup() {
  const [expanded, setExpanded] = useState(null)
  const t = useThemeColors()

  return (
    <div>
      {/* Status banner */}
      <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e2d42)', borderRadius: 12, padding: '20px 24px', marginBottom: 24, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Database size={18} color="#818cf8" />
        </div>
        <div>
          <p style={{ color: 'white', fontWeight: 700, fontSize: 14.5, marginBottom: 4 }}>Supabase Not Configured</p>
          <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.7 }}>
            PropertyOps AI is running in demo mode. Follow the 5 steps below to connect a real Supabase database — this enables real accounts, user roles, and persistent data.
            The platform shares auth infrastructure with InspectPro.
          </p>
        </div>
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {STEPS.map(step => {
          const isOpen = expanded === step.n
          const Icon = step.icon
          return (
            <div key={step.n} style={{ background: t.bgCard, borderRadius: 12, border: `1px solid ${t.border}`, overflow: 'hidden' }}>
              <button onClick={() => setExpanded(isOpen ? null : step.n)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'white', fontWeight: 800, fontSize: 14 }}>
                  {step.n}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, fontSize: 14, color: t.textPrimary }}>{step.title}</p>
                  <p style={{ fontSize: 12.5, color: t.textSecondary, marginTop: 2 }}>{step.desc}</p>
                </div>
                <Icon size={16} color={t.textMuted} />
              </button>

              {isOpen && (
                <div style={{ borderTop: `1px solid ${t.borderSubtle}`, padding: '16px 18px', background: t.bgCardAlt }}>
                  {step.action && (
                    <a href={step.action.url} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ textDecoration: 'none', marginBottom: step.code ? 14 : 0, display: 'inline-flex' }}>
                      <ExternalLink size={13} /> {step.action.label}
                    </a>
                  )}
                  {step.code && (
                    <div style={{ position: 'relative' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
                        <CopyButton text={step.code} />
                      </div>
                      <pre style={{
                        background: '#0f172a', color: '#e2e8f0',
                        padding: '14px 16px', borderRadius: 9,
                        fontSize: 11.5, lineHeight: 1.8,
                        overflow: 'auto', maxHeight: 320,
                        fontFamily: "'Courier New', monospace",
                        margin: 0,
                      }}>
                        {step.code}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Already have a project? */}
      <div style={{ marginTop: 20, padding: '14px 18px', background: t.bgCardAlt, borderRadius: 10, border: `1px solid ${t.border}` }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: t.textPrimary, marginBottom: 4 }}>
          Sharing with InspectPro?
        </p>
        <p style={{ fontSize: 12.5, color: t.textSecondary, lineHeight: 1.6 }}>
          If InspectPro is already connected to Supabase, you can use the same project.
          Just copy the same <code style={{ background: 'rgba(99,102,241,0.1)', padding: '1px 5px', borderRadius: 3, fontSize: 11 }}>VITE_SUPABASE_URL</code> and{' '}
          <code style={{ background: 'rgba(99,102,241,0.1)', padding: '1px 5px', borderRadius: 3, fontSize: 11 }}>VITE_SUPABASE_ANON_KEY</code> from{' '}
          <code style={{ background: 'rgba(99,102,241,0.1)', padding: '1px 5px', borderRadius: 3, fontSize: 11 }}>/InspectPro/.env</code> into{' '}
          <code style={{ background: 'rgba(99,102,241,0.1)', padding: '1px 5px', borderRadius: 3, fontSize: 11 }}>/PropertyOpsAI/.env</code>.
          Then just run the SQL in Step 4.
        </p>
      </div>
    </div>
  )
}
