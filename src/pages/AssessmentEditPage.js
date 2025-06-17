import { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Form, Alert, Spinner } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import { assessmentService, courseService } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const AssessmentEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [courses, setCourses] = useState([]);
  const [assessmentForm, setAssessmentForm] = useState({
    title: "",
    courseId: "",
    maxScore: 100,
    questions: []
  });

  // Fetch assessment data and courses on component mount
  useEffect(() => {
    // Only instructors should access this page
    if (user && user.role !== "Instructor") {
      navigate("/");
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch courses for dropdown
        const coursesResponse = await courseService.getInstructorCourses();
        setCourses(coursesResponse.data || []);

        // Fetch assessment if editing
        if (id) {
          await fetchAssessmentData();
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, user]);

  const fetchAssessmentData = async () => {
    try {
      const response = await assessmentService.getAssessmentById(id);
      
      if (response.data) {
        const assessmentData = response.data;
        
        // Parse questions if they're stored as a JSON string
        let questions = [];
        if (typeof assessmentData.questions === 'string') {
          try {
            questions = JSON.parse(assessmentData.questions);
          } catch (e) {
            console.error("Error parsing questions:", e);
            questions = [];
          }
        } else if (Array.isArray(assessmentData.questions)) {
          questions = assessmentData.questions;
        }
        
        // Format questions to ensure they have the correct structure
        questions = questions.map((q, index) => {
          return {
            id: q.id || `q${index + 1}`,
            text: q.text || q.questionText || `Question ${index + 1}`,
            options: (q.options || []).map((opt, optIndex) => {
              if (typeof opt === 'string') {
                return { id: `opt${optIndex}`, text: opt };
              }
              return {
                id: opt.id || `opt${optIndex}`,
                text: opt.text || opt.optionText || `Option ${optIndex + 1}`
              };
            }),
            correctOption: q.correctOption || "",
            points: q.points || 1
          };
        });
        
        setAssessmentForm({
          title: assessmentData.title || "",
          courseId: assessmentData.courseId || "",
          maxScore: assessmentData.maxScore || 100,
          questions: questions
        });
      }
    } catch (error) {
      console.error("Error fetching assessment:", error);
      setError("Failed to load assessment. Please try again.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAssessmentForm({
      ...assessmentForm,
      [name]: value
    });
  };

  const updateQuestion = (index, field, value) => {
    const updatedQuestions = [...assessmentForm.questions];
    
    if (field === "option") {
      // Update option text
      const [optionIndex, optionValue] = value;
      updatedQuestions[index].options[optionIndex].text = optionValue;
    } else if (field === "optionId") {
      // Update option ID
      const [optionIndex, optionValue] = value;
      updatedQuestions[index].options[optionIndex].id = optionValue;
    } else {
      // Update other question fields
      updatedQuestions[index][field] = value;
    }
    
    setAssessmentForm({
      ...assessmentForm,
      questions: updatedQuestions
    });
  };

  const addQuestion = () => {
    setAssessmentForm({
      ...assessmentForm,
      questions: [
        ...assessmentForm.questions,
        {
          id: `q${assessmentForm.questions.length + 1}`,
          text: "",
          options: [
            { id: "a", text: "" },
            { id: "b", text: "" },
            { id: "c", text: "" },
            { id: "d", text: "" }
          ],
          correctOption: "a",
          points: 1
        }
      ]
    });
  };

  const removeQuestion = (index) => {
    const updatedQuestions = [...assessmentForm.questions];
    updatedQuestions.splice(index, 1);
    
    // Update IDs to ensure they're sequential
    const reindexedQuestions = updatedQuestions.map((q, idx) => ({
      ...q,
      id: `q${idx + 1}`
    }));
    
    setAssessmentForm({
      ...assessmentForm,
      questions: reindexedQuestions
    });
  };

  const addOption = (questionIndex) => {
    const updatedQuestions = [...assessmentForm.questions];
    const optionLetters = "abcdefghijklmnopqrstuvwxyz";
    const nextOptionIndex = updatedQuestions[questionIndex].options.length;
    
    if (nextOptionIndex < optionLetters.length) {
      updatedQuestions[questionIndex].options.push({
        id: optionLetters[nextOptionIndex],
        text: ""
      });
      
      setAssessmentForm({
        ...assessmentForm,
        questions: updatedQuestions
      });
    }
  };

  const removeOption = (questionIndex, optionIndex) => {
    const updatedQuestions = [...assessmentForm.questions];
    
    // Ensure we keep at least 2 options
    if (updatedQuestions[questionIndex].options.length > 2) {
      updatedQuestions[questionIndex].options.splice(optionIndex, 1);
      
      // If the removed option was the correct one, set the first option as correct
      if (updatedQuestions[questionIndex].correctOption === updatedQuestions[questionIndex].options[optionIndex]?.id) {
        updatedQuestions[questionIndex].correctOption = updatedQuestions[questionIndex].options[0].id;
      }
      
      setAssessmentForm({
        ...assessmentForm,
        questions: updatedQuestions
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      // Validate form
      if (!assessmentForm.title.trim()) {
        setError("Assessment title is required");
        setSaving(false);
        return;
      }
      
      if (!assessmentForm.courseId) {
        setError("Please select a course");
        setSaving(false);
        return;
      }
      
      if (assessmentForm.questions.length === 0) {
        setError("At least one question is required");
        setSaving(false);
        return;
      }
      
      // Validate questions
      for (let i = 0; i < assessmentForm.questions.length; i++) {
        const q = assessmentForm.questions[i];
        
        if (!q.text.trim()) {
          setError(`Question ${i + 1} text is required`);
          setSaving(false);
          return;
        }
        
        if (q.options.length < 2) {
          setError(`Question ${i + 1} must have at least 2 options`);
          setSaving(false);
          return;
        }
        
        for (let j = 0; j < q.options.length; j++) {
          if (!q.options[j].text.trim()) {
            setError(`Option ${j + 1} in Question ${i + 1} is required`);
            setSaving(false);
            return;
          }
        }
        
        if (!q.correctOption) {
          setError(`Please select a correct answer for Question ${i + 1}`);
          setSaving(false);
          return;
        }
      }
      
      // Format assessment data for submission
      const formattedAssessment = {
        title: assessmentForm.title,
        courseId: assessmentForm.courseId,
        maxScore: parseInt(assessmentForm.maxScore),
        questions: JSON.stringify(assessmentForm.questions)
      };
      
      let response;
      if (id) {
        // Update existing assessment
        response = await assessmentService.updateAssessment(id, formattedAssessment);
        setSuccess("Assessment updated successfully!");
      } else {
        // Create new assessment
        response = await assessmentService.createAssessment(formattedAssessment);
        setSuccess("Assessment created successfully!");
        
        // Navigate to the edit page with the new ID
        if (response.data && response.data.assessmentId) {
          navigate(`/assessment/edit/${response.data.assessmentId}`);
        }
      }
    } catch (error) {
      console.error("Error saving assessment:", error);
      setError("Failed to save assessment. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="mb-4">
        <Button 
          variant="outline-secondary" 
          onClick={() => navigate('/assessment-management')}
        >
          ← Back to Assessment Management
        </Button>
      </div>
      
      <h2 className="mb-4">{id ? "Edit Assessment" : "Create Assessment"}</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      
      <Form onSubmit={handleSubmit}>
        <Card className="mb-4">
          <Card.Header>
            <h4>Assessment Details</h4>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Assessment Title</Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    value={assessmentForm.title}
                    onChange={handleInputChange}
                    placeholder="Enter assessment title"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Max Score</Form.Label>
                  <Form.Control
                    type="number"
                    name="maxScore"
                    min="1"
                    max="100"
                    value={assessmentForm.maxScore}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Course</Form.Label>
                  <Form.Select
                    name="courseId"
                    value={assessmentForm.courseId}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Course</option>
                    {courses.map((course) => (
                      <option key={course.courseId} value={course.courseId}>
                        {course.title}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>
        
        <h4 className="mb-3">Questions</h4>
        
        {assessmentForm.questions.length === 0 ? (
          <Alert variant="info">
            No questions added yet. Click "Add Question" to start creating your assessment.
          </Alert>
        ) : (
          assessmentForm.questions.map((question, qIndex) => (
            <Card key={qIndex} className="mb-4">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Question {qIndex + 1}</h5>
                <Button 
                  variant="outline-danger" 
                  size="sm" 
                  onClick={() => removeQuestion(qIndex)}
                >
                  Remove Question
                </Button>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Question Text</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={question.text}
                    onChange={(e) => updateQuestion(qIndex, "text", e.target.value)}
                    placeholder="Enter question text"
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Question ID (for reference)</Form.Label>
                  <Form.Control
                    type="text"
                    value={question.id}
                    onChange={(e) => updateQuestion(qIndex, "id", e.target.value)}
                    placeholder="Question ID"
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Points</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    value={question.points}
                    onChange={(e) => updateQuestion(qIndex, "points", parseInt(e.target.value))}
                    style={{ width: "100px" }}
                    required
                  />
                </Form.Group>
                
                <div className="mb-3">
                  <Form.Label>Options</Form.Label>
                  {question.options.map((option, oIndex) => (
                    <div key={oIndex} className="d-flex mb-2 align-items-center">
                      <Form.Check
                        type="radio"
                        name={`correct-option-${qIndex}`}
                        checked={question.correctOption === option.id}
                        onChange={() => updateQuestion(qIndex, "correctOption", option.id)}
                        className="me-2"
                      />
                      <Form.Control
                        type="text"
                        value={option.id}
                        onChange={(e) => updateQuestion(qIndex, "optionId", [oIndex, e.target.value])}
                        placeholder="ID"
                        className="me-2"
                        style={{ width: "80px" }}
                        required
                      />
                      <Form.Control
                        type="text"
                        value={option.text}
                        onChange={(e) => updateQuestion(qIndex, "option", [oIndex, e.target.value])}
                        placeholder={`Option ${oIndex + 1}`}
                        className="flex-grow-1"
                        required
                      />
                      {question.options.length > 2 && (
                        <Button 
                          variant="outline-danger" 
                          size="sm" 
                          className="ms-2"
                          onClick={() => removeOption(qIndex, oIndex)}
                        >
                          &times;
                        </Button>
                      )}
                    </div>
                  ))}
                  
                  <Button 
                    variant="outline-secondary" 
                    size="sm" 
                    onClick={() => addOption(qIndex)}
                    className="mt-2"
                  >
                    Add Option
                  </Button>
                </div>
              </Card.Body>
            </Card>
          ))
        )}
        
        <div className="d-flex justify-content-between mb-4">
          <Button 
            variant="outline-primary" 
            onClick={addQuestion}
          >
            Add Question
          </Button>
          
          <Button 
            variant="primary" 
            type="submit" 
            disabled={saving}
          >
            {saving ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                Saving...
              </>
            ) : (
              id ? "Update Assessment" : "Create Assessment"
            )}
          </Button>
        </div>
      </Form>
    </Container>
  );
};

export default AssessmentEditPage; 