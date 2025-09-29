import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Button } from '../styles/components/Button';
import { Container } from '../styles/GlobalStyles';
import { apiService } from '../services/apiService';

// Styled Components
const SettingsContainer = styled(Container)`
  padding-top: ${props => props.theme.spacing.xl};
  padding-bottom: ${props => props.theme.spacing.xl};
  min-height: 100vh;
  background: linear-gradient(135deg, ${props => props.theme.colors.background} 0%, #E0E7FF 100%);
`;

const Header = styled.header`
  text-align: center;
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
  margin-bottom: ${props => props.theme.spacing.md};
`;

const BackButton = styled(Button)`
  position: absolute;
  top: ${props => props.theme.spacing.lg};
  left: ${props => props.theme.spacing.lg};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
`;

const FormContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  padding: ${props => props.theme.spacing.xl};
`;

const Section = styled.div`
  margin-bottom: ${props => props.theme.spacing.xl};

  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin-bottom: ${props => props.theme.spacing.md};
  border-bottom: 2px solid ${props => props.theme.colors.primary};
  padding-bottom: ${props => props.theme.spacing.sm};
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${props => props.theme.spacing.md};

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    grid-template-columns: repeat(2, 1fr);
  }

  &.full-width {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
`;

const Label = styled.label`
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  font-size: 0.875rem;
`;

const Input = styled.input`
  padding: ${props => props.theme.spacing.sm};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 6px;
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.colors.primary}20;
  }
`;

const Textarea = styled.textarea`
  padding: ${props => props.theme.spacing.sm};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 6px;
  font-size: 1rem;
  min-height: 100px;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.colors.primary}20;
  }
`;

const Select = styled.select`
  padding: ${props => props.theme.spacing.sm};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 6px;
  font-size: 1rem;
  background: white;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.colors.primary}20;
  }
`;

const CheckboxGroup = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};

  input[type="checkbox"] {
    width: 16px;
    height: 16px;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
  margin-top: ${props => props.theme.spacing.xl};

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    flex-direction: row;
    justify-content: center;
    gap: ${props => props.theme.spacing.lg};
  }
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255,255,255,.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const SuccessMessage = styled.div`
  background: ${props => props.theme.colors.success};
  color: white;
  padding: ${props => props.theme.spacing.md};
  border-radius: 8px;
  margin-bottom: ${props => props.theme.spacing.md};
  font-weight: 500;
  text-align: center;
`;

const ErrorMessage = styled.div`
  background: ${props => props.theme.colors.danger};
  color: white;
  padding: ${props => props.theme.spacing.md};
  border-radius: 8px;
  margin-bottom: ${props => props.theme.spacing.md};
  font-weight: 500;
  text-align: center;
`;

const Settings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(null);

  // Form state
  const [profile, setProfile] = useState({
    // Personal Information
    first_name: '',
    last_name: '',
    preferred_name: '',
    company_name: '',
    job_title: '',

    // Address Information
    address_line_1: '',
    address_line_2: '',
    city: '',
    county: '',
    postcode: '',
    country: 'United Kingdom',

    // Contact Information
    mobile_phone: '',
    home_phone: '',
    work_phone: '',
    whatsapp_number: '',
    primary_email: '',
    work_email: '',
    personal_email: '',

    // Social Media
    facebook_handle: '',
    instagram_handle: '',
    twitter_handle: '',
    linkedin_handle: '',
    tiktok_handle: '',
    snapchat_handle: '',

    // Preferences
    preferred_language: 'en',
    timezone: 'Europe/London',
    date_format: 'DD/MM/YYYY',
    currency: 'GBP',

    // Privacy Settings
    share_phone: false,
    share_email: false,
    share_social_media: false,

    // Notes
    notes: ''
  });

  useEffect(() => {
    loadUserProfile();
  }, []);

  // Auto-redirect countdown effect
  useEffect(() => {
    let timer;
    if (countdown !== null && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0) {
      navigate('/');
    }
    return () => clearTimeout(timer);
  }, [countdown, navigate]);

  const loadUserProfile = async () => {
    setLoading(true);
    try {
      const response = await apiService.getUserProfile();
      if (response.success) {
        const userData = response.profile;

        // Remove date_of_birth formatting (field removed)

        setProfile(prev => ({
          ...prev,
          ...userData
        }));
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      setError('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear messages when user starts typing
    if (success) setSuccess(null);
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await apiService.updateUserProfile(profile);
      if (response.success) {
        setSuccess('Profile updated successfully!');
        setCountdown(10);
        // Update the profile with returned data (date_of_birth removed)
        setProfile(prev => ({
          ...prev,
          ...response.profile
        }));
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SettingsContainer>
        <Header>
          <Title>Loading Settings...</Title>
          <LoadingSpinner />
        </Header>
      </SettingsContainer>
    );
  }

  return (
    <SettingsContainer>
      <BackButton
        variant="outline"
        onClick={() => navigate('/')}
      >
        ← Back to Dashboard
      </BackButton>

      <Header>
        <Title>⚙️ User Profile Settings</Title>
      </Header>

      <FormContainer>
        {success && (
          <SuccessMessage>
            {success}
            {countdown !== null && countdown > 0 && (
              <div style={{ marginTop: '8px', fontSize: '0.9em' }}>
                Redirecting to dashboard in {countdown} seconds...
              </div>
            )}
          </SuccessMessage>
        )}
        {error && <ErrorMessage>{error}</ErrorMessage>}

        <form onSubmit={handleSubmit}>
          {/* Personal Information */}
          <Section>
            <SectionTitle>📝 Personal Information</SectionTitle>
            <FormGrid>
              <FormGroup>
                <Label>First Name *</Label>
                <Input
                  type="text"
                  value={profile.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label>Last Name *</Label>
                <Input
                  type="text"
                  value={profile.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label>Preferred Name</Label>
                <Input
                  type="text"
                  value={profile.preferred_name}
                  onChange={(e) => handleInputChange('preferred_name', e.target.value)}
                  placeholder="What you like to be called"
                />
              </FormGroup>
              <FormGroup>
                <Label>Company Name</Label>
                <Input
                  type="text"
                  value={profile.company_name}
                  onChange={(e) => handleInputChange('company_name', e.target.value)}
                  placeholder="Your company or organization"
                />
              </FormGroup>
              <FormGroup>
                <Label>Job Title</Label>
                <Input
                  type="text"
                  value={profile.job_title}
                  onChange={(e) => handleInputChange('job_title', e.target.value)}
                  placeholder="Your role or position"
                />
              </FormGroup>
            </FormGrid>
          </Section>

          {/* Address Information */}
          <Section>
            <SectionTitle>🏠 Address Information</SectionTitle>
            <FormGrid>
              <FormGroup>
                <Label>Address Line 1</Label>
                <Input
                  type="text"
                  value={profile.address_line_1}
                  onChange={(e) => handleInputChange('address_line_1', e.target.value)}
                  placeholder="Street address"
                />
              </FormGroup>
              <FormGroup>
                <Label>Address Line 2</Label>
                <Input
                  type="text"
                  value={profile.address_line_2}
                  onChange={(e) => handleInputChange('address_line_2', e.target.value)}
                  placeholder="Apartment, suite, etc."
                />
              </FormGroup>
              <FormGroup>
                <Label>City</Label>
                <Input
                  type="text"
                  value={profile.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                />
              </FormGroup>
              <FormGroup>
                <Label>County</Label>
                <Input
                  type="text"
                  value={profile.county}
                  onChange={(e) => handleInputChange('county', e.target.value)}
                />
              </FormGroup>
              <FormGroup>
                <Label>Postcode</Label>
                <Input
                  type="text"
                  value={profile.postcode}
                  onChange={(e) => handleInputChange('postcode', e.target.value)}
                  placeholder="SW1A 1AA"
                />
              </FormGroup>
              <FormGroup>
                <Label>Country</Label>
                <Select
                  value={profile.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                >
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Ireland">Ireland</option>
                  <option value="France">France</option>
                  <option value="Germany">Germany</option>
                  <option value="Spain">Spain</option>
                  <option value="Italy">Italy</option>
                  <option value="Netherlands">Netherlands</option>
                  <option value="Belgium">Belgium</option>
                  <option value="Other">Other</option>
                </Select>
              </FormGroup>
            </FormGrid>
          </Section>

          {/* Contact Information */}
          <Section>
            <SectionTitle>📞 Contact Information</SectionTitle>
            <FormGrid>
              <FormGroup>
                <Label>Mobile Phone *</Label>
                <Input
                  type="tel"
                  value={profile.mobile_phone}
                  onChange={(e) => handleInputChange('mobile_phone', e.target.value)}
                  placeholder="07123456789"
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label>Home Phone</Label>
                <Input
                  type="tel"
                  value={profile.home_phone}
                  onChange={(e) => handleInputChange('home_phone', e.target.value)}
                  placeholder="01234567890"
                />
              </FormGroup>
              <FormGroup>
                <Label>Work Phone</Label>
                <Input
                  type="tel"
                  value={profile.work_phone}
                  onChange={(e) => handleInputChange('work_phone', e.target.value)}
                  placeholder="01234567890"
                />
              </FormGroup>
              <FormGroup>
                <Label>WhatsApp Number</Label>
                <Input
                  type="tel"
                  value={profile.whatsapp_number}
                  onChange={(e) => handleInputChange('whatsapp_number', e.target.value)}
                  placeholder="07123456789"
                />
              </FormGroup>
              <FormGroup>
                <Label>Primary Email *</Label>
                <Input
                  type="email"
                  value={profile.primary_email}
                  onChange={(e) => handleInputChange('primary_email', e.target.value)}
                  placeholder="name@example.com"
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label>Work Email</Label>
                <Input
                  type="email"
                  value={profile.work_email}
                  onChange={(e) => handleInputChange('work_email', e.target.value)}
                  placeholder="work@company.com"
                />
              </FormGroup>
            </FormGrid>
          </Section>

          {/* Social Media */}
          <Section>
            <SectionTitle>📱 Social Media</SectionTitle>
            <FormGrid>
              <FormGroup>
                <Label>Facebook Handle</Label>
                <Input
                  type="text"
                  value={profile.facebook_handle}
                  onChange={(e) => handleInputChange('facebook_handle', e.target.value)}
                  placeholder="username (without @)"
                />
              </FormGroup>
              <FormGroup>
                <Label>Instagram Handle</Label>
                <Input
                  type="text"
                  value={profile.instagram_handle}
                  onChange={(e) => handleInputChange('instagram_handle', e.target.value)}
                  placeholder="username (without @)"
                />
              </FormGroup>
              <FormGroup>
                <Label>Twitter Handle</Label>
                <Input
                  type="text"
                  value={profile.twitter_handle}
                  onChange={(e) => handleInputChange('twitter_handle', e.target.value)}
                  placeholder="username (without @)"
                />
              </FormGroup>
              <FormGroup>
                <Label>LinkedIn Handle</Label>
                <Input
                  type="text"
                  value={profile.linkedin_handle}
                  onChange={(e) => handleInputChange('linkedin_handle', e.target.value)}
                  placeholder="profile-name"
                />
              </FormGroup>
            </FormGrid>
          </Section>


          {/* System Preferences */}
          <Section>
            <SectionTitle>⚙️ System Preferences</SectionTitle>
            <FormGrid>
              <FormGroup>
                <Label>Preferred Language</Label>
                <Select
                  value={profile.preferred_language}
                  onChange={(e) => handleInputChange('preferred_language', e.target.value)}
                >
                  <option value="en">English</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="es">Spanish</option>
                  <option value="it">Italian</option>
                </Select>
              </FormGroup>
              <FormGroup>
                <Label>Timezone</Label>
                <Select
                  value={profile.timezone}
                  onChange={(e) => handleInputChange('timezone', e.target.value)}
                >
                  <option value="Europe/London">London (GMT)</option>
                  <option value="Europe/Paris">Paris (CET)</option>
                  <option value="Europe/Berlin">Berlin (CET)</option>
                  <option value="Europe/Madrid">Madrid (CET)</option>
                  <option value="Europe/Rome">Rome (CET)</option>
                </Select>
              </FormGroup>
              <FormGroup>
                <Label>Date Format</Label>
                <Select
                  value={profile.date_format}
                  onChange={(e) => handleInputChange('date_format', e.target.value)}
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY (UK)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                </Select>
              </FormGroup>
              <FormGroup>
                <Label>Currency</Label>
                <Select
                  value={profile.currency}
                  onChange={(e) => handleInputChange('currency', e.target.value)}
                >
                  <option value="GBP">GBP (£)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                </Select>
              </FormGroup>
            </FormGrid>
          </Section>

          {/* Privacy Settings */}
          <Section>
            <SectionTitle>🔒 Privacy Settings</SectionTitle>
            <FormGrid className="full-width">
              <CheckboxGroup>
                <input
                  type="checkbox"
                  id="share_phone"
                  checked={profile.share_phone}
                  onChange={(e) => handleInputChange('share_phone', e.target.checked)}
                />
                <Label htmlFor="share_phone">Share phone number in reports and exports</Label>
              </CheckboxGroup>
              <CheckboxGroup>
                <input
                  type="checkbox"
                  id="share_email"
                  checked={profile.share_email}
                  onChange={(e) => handleInputChange('share_email', e.target.checked)}
                />
                <Label htmlFor="share_email">Share email address in reports and exports</Label>
              </CheckboxGroup>
              <CheckboxGroup>
                <input
                  type="checkbox"
                  id="share_social_media"
                  checked={profile.share_social_media}
                  onChange={(e) => handleInputChange('share_social_media', e.target.checked)}
                />
                <Label htmlFor="share_social_media">Share social media handles in reports and exports</Label>
              </CheckboxGroup>
            </FormGrid>
          </Section>

          {/* Notes */}
          <Section>
            <SectionTitle>📝 Additional Notes</SectionTitle>
            <FormGrid className="full-width">
              <FormGroup>
                <Label>Notes</Label>
                <Textarea
                  value={profile.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Any additional information or preferences..."
                />
              </FormGroup>
            </FormGrid>
          </Section>

          {/* Action Buttons */}
          <ButtonGroup>
            <Button
              type="submit"
              size="lg"
              disabled={saving}
            >
              {saving ? <LoadingSpinner /> : '💾 Save Profile'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => navigate('/')}
            >
              Cancel
            </Button>
          </ButtonGroup>
        </form>
      </FormContainer>
    </SettingsContainer>
  );
};

export default Settings;