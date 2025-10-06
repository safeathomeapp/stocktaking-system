import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { Button } from '../styles/components/Button';
import { Container } from '../styles/GlobalStyles';
import { apiService } from '../services/apiService';

const AreaContainer = styled(Container)`
  padding-top: ${props => props.theme.spacing.lg};
  padding-bottom: ${props => props.theme.spacing.xl};
  min-height: 100vh;
  background: linear-gradient(135deg, ${props => props.theme.colors.background} 0%, #EEF2FF 100%);
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.xl};
  padding: ${props => props.theme.spacing.xl};
  background: ${props => props.theme.colors.surface};
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid ${props => props.theme.colors.border};

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
`;

const HeaderContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.sm};
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
  margin: 0;

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    font-size: 1.75rem;
  }
`;

const Subtitle = styled.p`
  font-size: 0.875rem;
  color: ${props => props.theme.colors.textSecondary};
  margin: 0;

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    font-size: 1rem;
  }
`;

const AreasSection = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: 16px;
  padding: ${props => props.theme.spacing.xl};
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid ${props => props.theme.colors.border};
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin: 0 0 ${props => props.theme.spacing.lg} 0;

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    font-size: 1.5rem;
  }
`;

const AreasList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
`;

const AreaItem = styled.div`
  padding: ${props => props.theme.spacing.lg};
  border: 2px solid ${props => props.isDragging ? props.theme.colors.primary : props.theme.colors.border};
  border-radius: 12px;
  background: ${props => props.isDragging ? '#F0F9FF' : props.theme.colors.background};
  cursor: move;
  transition: all 0.2s ease;
  opacity: ${props => props.isDragging ? 0.8 : 1};

  &:hover {
    border-color: ${props => props.theme.colors.primary};
    transform: translateY(-1px);
    box-shadow: 0 4px 8px -2px rgba(0, 0, 0, 0.1);
  }
`;

const AreaHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const AreaName = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin: 0;
`;

const AreaActions = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  align-items: center;
`;

const PhotoSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.sm};
`;

const PhotoPreview = styled.div`
  width: 120px;
  height: 80px;
  border-radius: 8px;
  background: ${props => props.photo ? `url(${props.photo})` : '#F3F4F6'};
  background-size: cover;
  background-position: center;
  border: 2px dashed ${props => props.theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme.colors.textSecondary};
  font-size: 0.875rem;
`;

const PhotoButton = styled.button`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 6px;
  background: ${props => props.theme.colors.surface};
  color: ${props => props.theme.colors.text};
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme.colors.background};
    border-color: ${props => props.theme.colors.primary};
  }
`;

const DragHandle = styled.div`
  color: ${props => props.theme.colors.textSecondary};
  font-size: 1.2rem;
  cursor: move;
  padding: ${props => props.theme.spacing.xs};
`;

const EditableInput = styled.input`
  background: transparent;
  border: none;
  font-size: 1.125rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  padding: ${props => props.theme.spacing.xs};
  border-radius: 4px;
  width: 100%;

  &:focus {
    outline: none;
    background: ${props => props.theme.colors.background};
    border: 1px solid ${props => props.theme.colors.primary};
  }
`;

const ErrorMessage = styled.div`
  background: ${props => props.theme.colors.danger};
  color: white;
  padding: ${props => props.theme.spacing.md};
  border-radius: 8px;
  margin-bottom: ${props => props.theme.spacing.md};
  font-weight: 500;
`;

const SuccessMessage = styled.div`
  background: #10B981;
  color: white;
  padding: ${props => props.theme.spacing.md};
  border-radius: 8px;
  margin-bottom: ${props => props.theme.spacing.md};
  font-weight: 500;
`;

const AddAreaButton = styled(Button)`
  margin-top: ${props => props.theme.spacing.lg};
  width: 100%;

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    width: auto;
  }
`;

const AreaSetup = () => {
  const navigate = useNavigate();
  const { venueId } = useParams();
  const [venue, setVenue] = useState(null);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const fileInputRefs = useRef({});

  useEffect(() => {
    if (venueId) {
      fetchVenueAndAreas();
    }
  }, [venueId]);

  const fetchVenueAndAreas = async () => {
    try {
      const [venueResponse, areasResponse] = await Promise.all([
        apiService.getVenueById(venueId),
        apiService.getVenueAreas(venueId)
      ]);

      if (venueResponse.success) {
        setVenue(venueResponse.data.venue);
      }

      if (areasResponse.success) {
        setAreas(areasResponse.data.areas || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load venue and area data.');
    }
  };

  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();

    if (draggedItem === null || draggedItem === dropIndex) {
      setDraggedItem(null);
      return;
    }

    const newAreas = [...areas];
    const draggedArea = newAreas[draggedItem];

    // Remove the dragged item
    newAreas.splice(draggedItem, 1);

    // Insert at new position
    const insertIndex = draggedItem < dropIndex ? dropIndex - 1 : dropIndex;
    newAreas.splice(insertIndex, 0, draggedArea);

    // Update order values
    const updatedAreas = newAreas.map((area, index) => ({
      ...area,
      order: index + 1
    }));

    setAreas(updatedAreas);
    setDraggedItem(null);

    // Save the new order
    saveAreaOrder(updatedAreas);
  };

  const saveAreaOrder = async (orderedAreas) => {
    try {
      for (const area of orderedAreas) {
        await apiService.updateArea(area.id, { display_order: area.order });
      }
      setSuccess('Area order updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error updating area order:', error);
      setError('Failed to save area order.');
    }
  };

  const handleNameEdit = async (areaId, newName) => {
    if (!newName.trim()) return;

    try {
      const response = await apiService.updateArea(areaId, { name: newName.trim() });
      if (response.success) {
        setAreas(prev => prev.map(area =>
          area.id === areaId ? { ...area, name: newName.trim() } : area
        ));
        setSuccess('Area name updated successfully!');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (error) {
      console.error('Error updating area name:', error);
      setError('Failed to update area name.');
    }
  };

  // Helper function to compress and convert image to base64
  const compressAndConvertToBase64 = (source) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        // Calculate new dimensions (max 800px width/height)
        const maxSize = 800;
        let { width, height } = img;

        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        // Set canvas size and draw compressed image
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to base64 with compression (0.7 quality)
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        resolve(compressedBase64);
      };

      img.onerror = reject;

      // Handle different source types (File or Blob)
      if (source instanceof File || source instanceof Blob) {
        const url = URL.createObjectURL(source);
        img.src = url;
      } else {
        img.src = source;
      }
    });
  };

  const handlePhotoCapture = async (areaId) => {
    try {
      // Check if the browser supports camera access
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        // Fallback to file input if camera API not supported
        if (fileInputRefs.current[areaId]) {
          fileInputRefs.current[areaId].click();
        }
        return;
      }

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      // Create a video element to show camera feed
      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      video.playsInline = true;

      // Create camera modal with proper structure
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background: rgba(0, 0, 0, 0.95) !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: center !important;
        z-index: 999999 !important;
        padding: 20px !important;
        box-sizing: border-box !important;
      `;

      const cameraContainer = document.createElement('div');
      cameraContainer.style.cssText = `
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        gap: 20px !important;
        max-width: 95vw !important;
        max-height: 95vh !important;
      `;

      video.style.cssText = `
        max-width: 100% !important;
        max-height: 70vh !important;
        border-radius: 12px !important;
        box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important;
      `;

      const buttonContainer = document.createElement('div');
      buttonContainer.style.cssText = `
        display: flex !important;
        gap: 20px !important;
        justify-content: center !important;
        align-items: center !important;
        flex-wrap: wrap !important;
      `;

      const captureBtn = document.createElement('button');
      captureBtn.textContent = '📸 Capture Photo';
      captureBtn.style.cssText = `
        padding: 16px 32px !important;
        background: #10B981 !important;
        color: white !important;
        border: none !important;
        border-radius: 12px !important;
        font-size: 18px !important;
        font-weight: 700 !important;
        cursor: pointer !important;
        box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3) !important;
        transition: all 0.2s ease !important;
        min-width: 160px !important;
      `;

      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = '❌ Cancel';
      cancelBtn.style.cssText = `
        padding: 16px 32px !important;
        background: #EF4444 !important;
        color: white !important;
        border: none !important;
        border-radius: 12px !important;
        font-size: 18px !important;
        font-weight: 700 !important;
        cursor: pointer !important;
        box-shadow: 0 4px 16px rgba(239, 68, 68, 0.3) !important;
        transition: all 0.2s ease !important;
        min-width: 120px !important;
      `;

      // Add hover effects
      captureBtn.onmouseenter = () => {
        captureBtn.style.background = '#059669 !important';
        captureBtn.style.transform = 'translateY(-2px) !important';
      };
      captureBtn.onmouseleave = () => {
        captureBtn.style.background = '#10B981 !important';
        captureBtn.style.transform = 'translateY(0) !important';
      };

      cancelBtn.onmouseenter = () => {
        cancelBtn.style.background = '#DC2626 !important';
        cancelBtn.style.transform = 'translateY(-2px) !important';
      };
      cancelBtn.onmouseleave = () => {
        cancelBtn.style.background = '#EF4444 !important';
        cancelBtn.style.transform = 'translateY(0) !important';
      };


      // Handle capture
      captureBtn.onclick = () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);

        // Convert to blob and update area
        canvas.toBlob(async (blob) => {
          try {
            // Compress and convert blob to base64
            const base64Photo = await compressAndConvertToBase64(blob);

            // Update local state immediately
            setAreas(prev => prev.map(area =>
              area.id === areaId ? { ...area, photo: base64Photo } : area
            ));

            // Save to database
            const response = await apiService.updateArea(areaId, {
              photo: base64Photo
            });

            if (response.success) {
              setSuccess('Photo captured and saved successfully!');
              setTimeout(() => setSuccess(null), 3000);
            } else {
              throw new Error(response.error);
            }
          } catch (saveError) {
            console.error('Error saving photo to database:', saveError);
            setError('Photo captured but failed to save: ' + saveError.message);
            setTimeout(() => setError(null), 5000);
            // Keep the photo in local state even if save fails
          }

          // Clean up
          stream.getTracks().forEach(track => track.stop());
          document.body.removeChild(modal);
        }, 'image/jpeg', 0.8);
      };

      // Handle cancel
      cancelBtn.onclick = () => {
        stream.getTracks().forEach(track => track.stop());
        document.body.removeChild(modal);
      };

      // Handle escape key
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          stream.getTracks().forEach(track => track.stop());
          document.body.removeChild(modal);
          document.removeEventListener('keydown', handleKeyDown);
        }
      };
      document.addEventListener('keydown', handleKeyDown);

      // Assemble modal
      cameraContainer.appendChild(video);
      buttonContainer.appendChild(captureBtn);
      buttonContainer.appendChild(cancelBtn);
      modal.appendChild(cameraContainer);
      modal.appendChild(buttonContainer);
      document.body.appendChild(modal);

    } catch (error) {
      console.error('Camera access error:', error);
      setError('Unable to access camera. Please ensure camera permissions are granted and try again.');

      // Fallback to file input
      if (fileInputRefs.current[areaId]) {
        fileInputRefs.current[areaId].click();
      }
    }
  };

  const handlePhotoChange = async (areaId, event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      // Compress and convert file to base64
      const base64Photo = await compressAndConvertToBase64(file);

      // Update local state immediately for preview
      setAreas(prev => prev.map(area =>
        area.id === areaId ? { ...area, photo: base64Photo } : area
      ));

      // Save to database
      const response = await apiService.updateArea(areaId, {
        photo: base64Photo
      });

      if (response.success) {
        setSuccess('Photo saved successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('Error saving photo:', error);
      setError('Failed to save photo: ' + error.message);
      setTimeout(() => setError(null), 5000);

      // Revert local state on error
      setAreas(prev => prev.map(area =>
        area.id === areaId ? { ...area, photo: null } : area
      ));
    }
  };


  const addNewArea = async () => {
    try {
      const newAreaData = {
        name: `Area ${areas.length + 1}`,
        order: areas.length + 1
      };

      const response = await apiService.addVenueArea(venueId, newAreaData);
      if (response.success) {
        setAreas(prev => [...prev, response.data.area]);
        setSuccess('New area added successfully!');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (error) {
      console.error('Error adding area:', error);
      setError('Failed to add new area.');
    }
  };

  const deleteArea = async (areaId) => {
    if (!window.confirm('Are you sure you want to delete this area?')) return;

    try {
      const response = await apiService.deleteArea(areaId);
      if (response.success) {
        setAreas(prev => prev.filter(area => area.id !== areaId));
        setSuccess('Area deleted successfully!');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (error) {
      console.error('Error deleting area:', error);
      setError('Failed to delete area.');
    }
  };

  if (!venue) {
    return (
      <AreaContainer>
        <Header>
          <HeaderContent>
            <Title>Loading...</Title>
          </HeaderContent>
        </Header>
      </AreaContainer>
    );
  }

  return (
    <AreaContainer>
      <Header>
        <HeaderContent>
          <Title>📍 Set-up Areas - {venue.name}</Title>
          <Subtitle>
            Configure area names, capture reference photos, and set ordering for your stock-taking sessions
          </Subtitle>
        </HeaderContent>
        <Button variant="outline" onClick={() => navigate('/')}>
          Back to Dashboard
        </Button>
      </Header>

      <AreasSection>
        <SectionTitle>Areas Configuration</SectionTitle>

        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success && <SuccessMessage>{success}</SuccessMessage>}

        <AreasList>
          {areas.map((area, index) => (
            <AreaItem
              key={area.id}
              draggable
              isDragging={draggedItem === index}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
            >
              <AreaHeader>
                <EditableInput
                  value={area.name}
                  onChange={(e) => {
                    const newAreas = [...areas];
                    newAreas[index].name = e.target.value;
                    setAreas(newAreas);
                  }}
                  onBlur={(e) => handleNameEdit(area.id, e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.target.blur();
                    }
                  }}
                />

                <AreaActions>
                  <DragHandle>⋮⋮</DragHandle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteArea(area.id)}
                  >
                    🗑️
                  </Button>
                </AreaActions>
              </AreaHeader>

              <PhotoSection>
                <PhotoPreview photo={area.photo}>
                  {!area.photo && '📷 No Photo'}
                </PhotoPreview>
                <PhotoButton onClick={() => handlePhotoCapture(area.id)}>
                  📸 Capture Reference Photo
                </PhotoButton>
                <input
                  ref={el => fileInputRefs.current[area.id] = el}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  style={{ display: 'none' }}
                  onChange={(e) => handlePhotoChange(area.id, e)}
                />
              </PhotoSection>
            </AreaItem>
          ))}

          {areas.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              color: '#6B7280',
              fontStyle: 'italic'
            }}>
              No areas configured yet. Add your first area below.
            </div>
          )}
        </AreasList>

        <AddAreaButton
          onClick={addNewArea}
          variant="secondary"
          disabled={loading}
        >
          ➕ Add New Area
        </AddAreaButton>
      </AreasSection>
    </AreaContainer>
  );
};

export default AreaSetup;