import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Register() {
  const [formData, setFormData] = useState({
    applicationId: '',
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    mhtCetPercentile: '',
    mhtCetScore: '',
    jeeMainPercentile: '',
    category: 'OPEN',
    gender: 'Male',
    isPWD: false,
    isDEF: false,
    isOrphan: false,
    isMinority: false,
    studentType: 'CAP',
    sscAggregate: '',
    sscMaths: '',
    sscScience: '',
    sscEnglish: '',
    hscPercentage: '',
    diplomaPercentage: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!formData.applicationId.trim()) {
      setError('MHT-CET Application ID is required');
      return;
    }

    setLoading(true);
    try {
      const submitData = { ...formData };
      delete submitData.confirmPassword;
      // Convert numeric strings to numbers
      submitData.mhtCetPercentile = parseFloat(submitData.mhtCetPercentile) || 0;
      submitData.mhtCetScore = parseFloat(submitData.mhtCetScore) || 0;
      submitData.jeeMainPercentile = parseFloat(submitData.jeeMainPercentile) || 0;
      submitData.sscAggregate = parseFloat(submitData.sscAggregate) || 0;
      submitData.sscMaths = parseFloat(submitData.sscMaths) || 0;
      submitData.sscScience = parseFloat(submitData.sscScience) || 0;
      submitData.sscEnglish = parseFloat(submitData.sscEnglish) || 0;
      submitData.hscPercentage = parseFloat(submitData.hscPercentage) || 0;
      submitData.diplomaPercentage = parseFloat(submitData.diplomaPercentage) || 0;

      await register(submitData);
      navigate('/student');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Registration failed');
    }
    setLoading(false);
  };

  return (
    <>
      <div className="banner">
        THIS FORM IS ONLY FOR STUDENTS APPLYING FOR 1ST YEAR ACAP / SPOT ROUND REGISTRATION
      </div>
      <main className="main-content">
        <div className="form-container">
          {/* Instructions */}
          <div className="instructions-card">
            <h3>Read Before You Begin — Candidate Instructions</h3>
            <ol>
              <li>If you are a Diploma student, select "Diploma Student" below.</li>
              <li>If you appeared for MHT-CET and your name is in the CAP merit list, select "CAP Student".</li>
              <li>If you appeared for CET or JEE but did not complete CAP registration, select "Non-CAP Student".</li>
              <li>Enter your <strong>MHT-CET Application ID</strong> as it appears on your CET admit card/scorecard.</li>
              <li>All fields marked with <span style={{color:'red'}}>*</span> are mandatory.</li>
            </ol>
          </div>

          <div className="card">
            <div className="card-header">
              <h2>Spot Round Registration</h2>
            </div>
            <div className="card-body">
              {error && <div className="alert alert-error">{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  {/* Student Type */}
                  <div className="form-section-title">Student Type</div>
                  <div className="form-group full-width">
                    <label htmlFor="studentType">Student Type <span className="required">*</span></label>
                    <select id="studentType" name="studentType" value={formData.studentType} onChange={handleChange}>
                      <option value="CAP">CAP Student (MHT-CET Merit List)</option>
                      <option value="Non-CAP">Non-CAP Student (Appeared for CET/JEE)</option>
                      <option value="Diploma">Diploma Student</option>
                    </select>
                  </div>

                  {/* MHT-CET Application ID */}
                  <div className="form-section-title">MHT-CET Details</div>
                  <div className="form-group full-width">
                    <label htmlFor="applicationId">MHT-CET Application ID <span className="required">*</span></label>
                    <input
                      id="applicationId"
                      name="applicationId"
                      type="text"
                      value={formData.applicationId}
                      onChange={handleChange}
                      placeholder="Enter your MHT-CET Application ID (e.g., EN24XXXXXX)"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="mhtCetPercentile">MHT-CET Percentile <span className="required">*</span></label>
                    <input
                      id="mhtCetPercentile"
                      name="mhtCetPercentile"
                      type="number"
                      step="0.01"
                      value={formData.mhtCetPercentile}
                      onChange={handleChange}
                      placeholder="e.g., 95.50"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="mhtCetScore">MHT-CET Score</label>
                    <input
                      id="mhtCetScore"
                      name="mhtCetScore"
                      type="number"
                      value={formData.mhtCetScore}
                      onChange={handleChange}
                      placeholder="e.g., 145"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="jeeMainPercentile">JEE Main Percentile (if applicable)</label>
                    <input
                      id="jeeMainPercentile"
                      name="jeeMainPercentile"
                      type="number"
                      step="0.01"
                      value={formData.jeeMainPercentile}
                      onChange={handleChange}
                      placeholder="e.g., 89.50"
                    />
                  </div>

                  {/* Personal Information */}
                  <div className="form-section-title">Personal Information</div>

                  <div className="form-group full-width">
                    <label htmlFor="fullName">Full Name <span className="required">*</span></label>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="Enter your full name as per marksheet"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email Address <span className="required">*</span></label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone">Mobile Number <span className="required">*</span></label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="10-digit mobile number"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="password">Password <span className="required">*</span></label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Minimum 6 characters"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm Password <span className="required">*</span></label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Re-enter password"
                      required
                    />
                  </div>

                  {/* Category & Reservation */}
                  <div className="form-section-title">Category & Reservation Details</div>

                  <div className="form-group">
                    <label htmlFor="category">Category <span className="required">*</span></label>
                    <select id="category" name="category" value={formData.category} onChange={handleChange}>
                      <option value="OPEN">OPEN (General)</option>
                      <option value="SC">SC (Scheduled Caste)</option>
                      <option value="ST">ST (Scheduled Tribe)</option>
                      <option value="VJ_DT">VJ/DT (Vimukta Jati / De-notified Tribe)</option>
                      <option value="NTB">NT-B (Nomadic Tribe B)</option>
                      <option value="NTC">NT-C (Nomadic Tribe C)</option>
                      <option value="NTD">NT-D (Nomadic Tribe D)</option>
                      <option value="OBC">OBC (Other Backward Class)</option>
                      <option value="SEBC">SEBC (Socially & Educationally Backward Class)</option>
                      <option value="EWS">EWS (Economically Weaker Section)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="gender">Gender <span className="required">*</span></label>
                    <select id="gender" name="gender" value={formData.gender} onChange={handleChange}>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>

                  <div className="form-group full-width" style={{ display: 'flex', flexDirection: 'row', gap: '24px', flexWrap: 'wrap' }}>
                    <div className="checkbox-group">
                      <input type="checkbox" id="isPWD" name="isPWD" checked={formData.isPWD} onChange={handleChange} />
                      <label htmlFor="isPWD">Person with Disability (PWD)</label>
                    </div>
                    <div className="checkbox-group">
                      <input type="checkbox" id="isDEF" name="isDEF" checked={formData.isDEF} onChange={handleChange} />
                      <label htmlFor="isDEF">Defence Category (DEF)</label>
                    </div>
                    <div className="checkbox-group">
                      <input type="checkbox" id="isOrphan" name="isOrphan" checked={formData.isOrphan} onChange={handleChange} />
                      <label htmlFor="isOrphan">Orphan</label>
                    </div>
                    <div className="checkbox-group">
                      <input type="checkbox" id="isMinority" name="isMinority" checked={formData.isMinority} onChange={handleChange} />
                      <label htmlFor="isMinority">Minority</label>
                    </div>
                  </div>

                  {/* Academic Details */}
                  <div className="form-section-title">Class X (SSC) Academic Metrics</div>

                  <div className="form-group">
                    <label htmlFor="sscAggregate">SSC Aggregate Percent</label>
                    <input
                      id="sscAggregate"
                      name="sscAggregate"
                      type="number"
                      step="0.01"
                      value={formData.sscAggregate}
                      onChange={handleChange}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="sscMaths">SSC Mathematics %</label>
                    <input
                      id="sscMaths"
                      name="sscMaths"
                      type="number"
                      step="0.01"
                      value={formData.sscMaths}
                      onChange={handleChange}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="sscScience">SSC Science %</label>
                    <input
                      id="sscScience"
                      name="sscScience"
                      type="number"
                      step="0.01"
                      value={formData.sscScience}
                      onChange={handleChange}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="sscEnglish">SSC English %</label>
                    <input
                      id="sscEnglish"
                      name="sscEnglish"
                      type="number"
                      step="0.01"
                      value={formData.sscEnglish}
                      onChange={handleChange}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="form-section-title">Class XII / Diploma Details</div>

                  <div className="form-group">
                    <label htmlFor="hscPercentage">HSC / 12th Percentage</label>
                    <input
                      id="hscPercentage"
                      name="hscPercentage"
                      type="number"
                      step="0.01"
                      value={formData.hscPercentage}
                      onChange={handleChange}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="diplomaPercentage">Diploma Percentage (if applicable)</label>
                    <input
                      id="diplomaPercentage"
                      name="diplomaPercentage"
                      type="number"
                      step="0.01"
                      value={formData.diplomaPercentage}
                      onChange={handleChange}
                      placeholder="0.00"
                    />
                  </div>

                  {/* Submit */}
                  <div className="form-group full-width" style={{ marginTop: '8px' }}>
                    <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
                      {loading ? 'Registering...' : 'Proceed to Review Data'}
                    </button>
                  </div>
                </div>
              </form>

              <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                Already registered? <Link to="/login" style={{ fontWeight: '600' }}>Login here</Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export default Register;
