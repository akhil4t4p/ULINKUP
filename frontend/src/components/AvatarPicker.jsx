import React, { useState } from 'react';
import NeomorphicCard from './NeomorphicCard';

// Avatar registry — easy to extend in the future
const MALE_AVATARS = [
  { id: 'male_bear', label: 'Bear' },
  { id: 'male_cheetah', label: 'Cheetah' },
  { id: 'male_dog', label: 'Dog' },
  { id: 'male_elephant', label: 'Elephant' },
  { id: 'male_lion', label: 'Lion' },
  { id: 'male_monkey', label: 'Monkey' },
  { id: 'male_panda', label: 'Panda' },
  { id: 'male_polarbear', label: 'Polar Bear' },
  { id: 'male_rabbit', label: 'Rabbit' },
  { id: 'male_tiger', label: 'Tiger' },
];

const FEMALE_AVATARS = [
  { id: 'female_bear', label: 'Bear' },
  { id: 'female_cheetah', label: 'Cheetah' },
  { id: 'female_dog', label: 'Dog' },
  { id: 'female_elephant', label: 'Elephant' },
  { id: 'female_lion', label: 'Lion' },
  { id: 'female_monkey', label: 'Monkey' },
  { id: 'female_panda', label: 'Panda' },
  { id: 'female_polarbear', label: 'Polar Bear' },
  { id: 'female_rabbit', label: 'Rabbit' },
  { id: 'female_tiger', label: 'Tiger' },
];

export default function AvatarPicker({ currentAvatar, onSelect, onClose }) {
  const [gender, setGender] = useState(
    currentAvatar?.startsWith('female') ? 'female' : 'male'
  );
  const [selected, setSelected] = useState(currentAvatar || '');
  const [saving, setSaving] = useState(false);

  const avatars = gender === 'male' ? MALE_AVATARS : FEMALE_AVATARS;

  const handleConfirm = async () => {
    if (!selected) return;
    setSaving(true);
    await onSelect(selected);
    setSaving(false);
  };

  return (
    <div 
      className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" 
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050, backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-100 px-3" style={{ maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}>
        <NeomorphicCard className="p-4" elevation="convex">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4 className="fw-bold mb-0">
              <i className="bi bi-emoji-smile me-2 text-primary"></i>Choose Your Avatar
            </h4>
            <button 
              type="button" 
              className="btn-close" 
              onClick={onClose} 
              aria-label="Close"
            ></button>
          </div>

          {/* Gender Tabs */}
          <div className="d-flex gap-2 mb-4">
            <button
              type="button"
              className={`neo-btn flex-fill py-2 fw-bold ${gender === 'male' ? 'active border-dark' : ''}`}
              onClick={() => setGender('male')}
            >
              <i className="bi bi-gender-male me-2 text-primary"></i>Male
            </button>
            <button
              type="button"
              className={`neo-btn flex-fill py-2 fw-bold ${gender === 'female' ? 'active border-dark' : ''}`}
              onClick={() => setGender('female')}
            >
              <i className="bi bi-gender-female me-2 text-danger"></i>Female
            </button>
          </div>

          {/* Avatar Grid */}
          <div className="row g-3 mb-4">
            {avatars.map((avatar) => {
              const isSelected = selected === avatar.id;
              return (
                <div key={avatar.id} className="col-4 col-md-15" style={{ flex: '0 0 20%', maxWidth: '20%' }}>
                  <div 
                    onClick={() => setSelected(avatar.id)}
                    className="text-center position-relative"
                    style={{ cursor: 'pointer' }}
                  >
                    <div 
                      className={`rounded-circle mx-auto overflow-hidden position-relative avatar-card ${isSelected ? 'avatar-selected' : ''}`}
                      style={{ 
                        width: '90px', 
                        height: '90px',
                        border: isSelected ? '3px solid var(--accent-color, #4285F4)' : '3px solid transparent',
                        boxShadow: isSelected ? '0 0 20px rgba(66,133,244,0.4)' : 'none',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    >
                      <img 
                        src={`/avatars/${avatar.id}.png`} 
                        alt={avatar.label} 
                        className="w-100 h-100" 
                        style={{ objectFit: 'cover' }}
                        loading="lazy"
                      />
                      {isSelected && (
                        <div 
                          className="position-absolute bottom-0 end-0 bg-primary rounded-circle d-flex align-items-center justify-content-center"
                          style={{ width: '24px', height: '24px', transform: 'translate(-2px, -2px)' }}
                        >
                          <i className="bi bi-check-lg text-white" style={{ fontSize: '14px' }}></i>
                        </div>
                      )}
                    </div>
                    <p className="text-muted small mt-1 mb-0 fw-semibold" style={{ fontSize: '0.7rem' }}>
                      {avatar.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Confirm Button */}
          <button 
            onClick={handleConfirm}
            disabled={!selected || saving}
            className="w-100 neo-btn-accent py-3 fw-bold"
          >
            {saving ? (
              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
            ) : (
              <><i className="bi bi-check-circle me-2"></i>Confirm Avatar</>
            )}
          </button>
        </NeomorphicCard>
      </div>

      {/* Avatar picker animations */}
      <style>{`
        .avatar-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .avatar-card:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 20px rgba(0,0,0,0.15) !important;
        }
        .avatar-card:active {
          transform: scale(0.95);
        }
        .avatar-selected {
          animation: avatarPulse 0.4s ease-out;
        }
        @keyframes avatarPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.08); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
