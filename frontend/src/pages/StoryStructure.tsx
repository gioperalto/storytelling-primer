import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface StoryStructureForm {
  talkTitle: string;
  audienceDescription: string;
  audienceProblem: string;
  shareableHeadline: string;
  keyTakeaways: string[];
}

const StoryStructure: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [formData, setFormData] = useState<StoryStructureForm>({
    talkTitle: '',
    audienceDescription: '',
    audienceProblem: '',
    shareableHeadline: '',
    keyTakeaways: ['']
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTakeawayChange = (index: number, value: string) => {
    const newTakeaways = [...formData.keyTakeaways];
    newTakeaways[index] = value;
    setFormData(prev => ({
      ...prev,
      keyTakeaways: newTakeaways
    }));
  };

  const addTakeaway = () => {
    setFormData(prev => ({
      ...prev,
      keyTakeaways: [...prev.keyTakeaways, '']
    }));
  };

  const removeTakeaway = (index: number) => {
    if (formData.keyTakeaways.length > 1) {
      const newTakeaways = formData.keyTakeaways.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        keyTakeaways: newTakeaways
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Filter out empty takeaways
      const filteredTakeaways = formData.keyTakeaways.filter(t => t.trim() !== '');

      const response = await axios.post(`${API_BASE_URL}/api/tactics/structure/suggest`, {
        ...formData,
        keyTakeaways: filteredTakeaways
      });

      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred while submitting the form');
      console.error('Error submitting form:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Story Structure Generator</h1>
        <p>Get AI-powered story structure suggestions for your talk</p>
        <button
          className="button purple"
          onClick={() => navigate('/')}
        >
          Back to Home
        </button>
      </header>

      <main className="main">
        <div className="container-form">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="talkTitle" className="form-label">
                Talk Title *
              </label>
              <input
                type="text"
                id="talkTitle"
                name="talkTitle"
                value={formData.talkTitle}
                onChange={handleInputChange}
                required
                className="form-input"
                placeholder="Enter your talk title"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label htmlFor="audienceDescription" className="form-label">
                  Target Audience
                </label>
                <textarea
                  id="audienceDescription"
                  name="audienceDescription"
                  value={formData.audienceDescription}
                  onChange={handleInputChange}
                  rows={3}
                  className="form-input"
                  placeholder="Describe your target audience"
                />
              </div>

              <div className="form-group">
                <label htmlFor="audienceProblem" className="form-label">
                  Challenge
                </label>
                <textarea
                  id="audienceProblem"
                  name="audienceProblem"
                  value={formData.audienceProblem}
                  onChange={handleInputChange}
                  rows={3}
                  className="form-input"
                  placeholder="What challenge does your audience face?"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="shareableHeadline" className="form-label">
                Shareable Headline
              </label>
              <input
                type="text"
                id="shareableHeadline"
                name="shareableHeadline"
                value={formData.shareableHeadline}
                onChange={handleInputChange}
                className="form-input"
                placeholder="A compelling headline for your talk"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Key Takeaways
              </label>
              <div className="takeaways-list">
                {formData.keyTakeaways.map((takeaway, index) => (
                  <div key={index} className="takeaway-item">
                    <input
                      type="text"
                      value={takeaway}
                      onChange={(e) => handleTakeawayChange(index, e.target.value)}
                      className="form-input"
                      placeholder={`Takeaway ${index + 1}`}
                    />
                    {formData.keyTakeaways.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTakeaway(index)}
                        className="button red"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addTakeaway}
                className="button blue"
              >
                Add Takeaway
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="button green submit-button"
            >
              {loading ? 'Generating...' : 'Suggest Story Structures'}
            </button>
          </form>

          {error && (
            <div className="alert-error">
              <strong>Error:</strong> {error}
            </div>
          )}

          {result && (
            <div className="alert-success">
              <h2>Story Structure Suggestions</h2>
              <pre>
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default StoryStructure;
