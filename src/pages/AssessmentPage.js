"use client"

import { useState, useEffect } from "react"
import { Container, Row, Col, Card, Button, Form, Alert, Spinner, ProgressBar } from "react-bootstrap"
import { useParams, useNavigate, useLocation } from "react-router-dom"
import { assessmentService, courseService } from "../services/api"
import { useAuth } from "../contexts/AuthContext"

const AssessmentPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [assessment, setAssessment] = useState(null)
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [answers, setAnswers] = useState([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState(null)
  const [questions, setQuestions] = useState([])
  const [viewMode, setViewMode] = useState(false)

  useEffect(() => {
    if (id && id !== 'undefined') {
      // Check if user is an instructor - if so, redirect to edit page
      if (user && user.role === 'Instructor') {
        // Only redirect if not explicitly viewing in preview mode
        const searchParams = new URLSearchParams(location.search);
        if (searchParams.get('mode') !== 'preview') {
          navigate(`/assessment/edit/${id}`);
          return;
        }
        setViewMode(true);
      }
      
      fetchAssessment();
    } else {
      setError("Invalid assessment ID")
      setLoading(false)
    }
  }, [id, user, location.search, navigate])

  const fetchAssessment = async () => {
    try {
      setLoading(true);
      const response = await assessmentService.getAssessmentById(id);
      const assessmentData = response.data;
      setAssessment(assessmentData);
      
      // Parse questions from JSON if needed
      let parsedQuestions = [];
      if (assessmentData.questions) {
        try {
          if (typeof assessmentData.questions === 'string') {
            parsedQuestions = JSON.parse(assessmentData.questions);
          } else {
            parsedQuestions = assessmentData.questions;
          }
          
          // Validate and normalize question structure
          parsedQuestions = parsedQuestions.map((q, index) => {
            // Ensure each question has an id
            if (!q.id) {
              q.id = `question-${index}`;
            }
            
            // Ensure text is a string
            if (typeof q.text !== 'string') {
              q.text = `Question ${index + 1}`;
            }
            
            // Ensure options is an array of strings
            if (!Array.isArray(q.options)) {
              q.options = ['Option 1', 'Option 2', 'Option 3', 'Option 4'];
            } else {
              // Make sure each option is a string
              q.options = q.options.map((opt, i) => {
                if (opt === null || opt === undefined) {
                  return `Option ${i + 1}`;
                }
                if (typeof opt === 'object') {
                  // Handle object options by extracting text or using a default
                  return opt.text || opt.value || opt.label || `Option ${i + 1}`;
                }
                return String(opt);
              });
            }
            
            // Ensure correctOption exists and is properly formatted
            if (q.correctOption === undefined || q.correctOption === null) {
              q.correctOption = "0"; // Default to first option
              console.log(`Question ${q.id}: Setting default correctOption = "0"`);
            } else {
              // Ensure correctOption is a string
              q.correctOption = String(q.correctOption);
              console.log(`Question ${q.id}: Normalized correctOption = "${q.correctOption}"`);
            }
            
            console.log(`Question structure:`, {
              id: q.id,
              text: q.text,
              options: q.options,
              correctOption: q.correctOption
            });
            
            return q;
          });
          
          console.log("Parsed and normalized questions:", parsedQuestions);
        } catch (err) {
          console.error("Error parsing questions:", err);
          parsedQuestions = [];
        }
      }
      
      setQuestions(parsedQuestions);
      
      // Initialize answers array
      const initialAnswers = new Array(parsedQuestions.length).fill(null);
      setAnswers(initialAnswers);
      
      // Fetch course information
      if (assessmentData.courseId) {
        const courseResponse = await courseService.getCourseById(assessmentData.courseId);
        setCourse(courseResponse.data);
      }
    } catch (err) {
      console.error("Error fetching assessment:", err);
      setError("Failed to load assessment. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  const handleAnswerSelect = (questionIndex, answerIndex) => {
    console.log(`Selected answer for question ${questionIndex}: option ${answerIndex}`);
    
    // Get the question object
    const question = questions[questionIndex];
    console.log(`Question ${question.id}: correctOption = "${question.correctOption}"`);
    
    const newAnswers = [...answers];
    newAnswers[questionIndex] = answerIndex;
    setAnswers(newAnswers);
    
    // Log if this would be considered correct
    console.log(`Would be correct: ${String(answerIndex) === question.correctOption}`);
  }

  const handleSubmit = async () => {
    // Check if all questions are answered
    if (answers.some(answer => answer === null)) {
      setError("Please answer all questions before submitting.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      
      // Create a proper answer object with question IDs as keys and selected option IDs as values
      const submittedAnswers = [];
      
      questions.forEach((question, index) => {
        // Make sure we're using the question ID or QuestionId as the key
        const questionId = question.questionId || question.QuestionId || question.id || `question-${index}`;
        
        // Add to the submitted answers array if an answer was selected
        if (answers[index] !== null) {
          // Get the option ID instead of the index
          const selectedOptionIndex = answers[index];
          const options = question.options || [];
          
          // Get the option ID from the selected option
          let selectedOptionId;
          
          if (options[selectedOptionIndex]) {
            if (typeof options[selectedOptionIndex] === 'object') {
              // If option is an object, use its id property
              selectedOptionId = options[selectedOptionIndex].id || String.fromCharCode(97 + selectedOptionIndex); // a, b, c, etc.
            } else {
              // If option is a string, use the letter corresponding to the index (a, b, c, etc.)
              selectedOptionId = String.fromCharCode(97 + selectedOptionIndex);
            }
          } else {
            // Fallback to using the index as a letter (a, b, c, etc.)
            selectedOptionId = String.fromCharCode(97 + selectedOptionIndex);
          }
          
          console.log(`Question ${questionId}: Selected option index ${selectedOptionIndex} maps to ID '${selectedOptionId}'`);
          
          submittedAnswers.push({
            questionId: questionId,
            selectedAnswerId: selectedOptionId
          });
        }
      });
      
      console.log("Submitting answers:", submittedAnswers);
      
      try {
        const response = await assessmentService.submitAssessment(id, {
          assessmentId: id,
          userId: user.id,
          submittedAnswers: submittedAnswers
        });
        console.log("Assessment submission response:", response.data);
        setResult(response.data);
        setSubmitted(true);
      } catch (submitError) {
        console.error("Submission error details:", submitError);
        if (submitError.response) {
          console.error("Server response:", submitError.response.data);
          setError(`Failed to submit: ${submitError.response.data || submitError.message}`);
        } else {
          setError("Network error. Please check your connection and try again.");
        }
      }
    } catch (err) {
      console.error("Error preparing assessment submission:", err);
      setError("Failed to submit your answers. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const navigateToNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  }

  const navigateToPreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  }

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading assessment...</p>
      </Container>
    );
  }

  if (!assessment || !questions || questions.length === 0) {
    return (
      <Container className="py-5 text-center">
        <Alert variant="danger">
          Assessment not found or has no questions.
        </Alert>
        <Button 
          variant="primary" 
          onClick={() => navigate(-1)}
          className="mt-3"
        >
          Go Back
        </Button>
      </Container>
    );
  }

  // Results screen after submission
  if (submitted && result) {
    console.log("Displaying result:", result);
    console.log("Raw result data:", JSON.stringify(result, null, 2));
    
    // Calculate values from result data
    const score = result.score !== undefined ? result.score : 0;
    const maxScore = result.maxScore !== undefined ? result.maxScore : (assessment.maxScore || questions.length);
    const correctAnswers = result.correctAnswers !== undefined ? result.correctAnswers : 0;
    const totalQuestions = result.totalQuestions !== undefined ? result.totalQuestions : questions.length;
    const percentage = result.percentage !== undefined ? result.percentage : 
      (maxScore > 0 ? (score / maxScore) * 100 : 0);
    
    console.log("Processed result values:", {
      score,
      maxScore,
      correctAnswers,
      totalQuestions,
      percentage
    });
    
    return (
      <Container className="py-4">
        <Card className="shadow-sm border-0 mb-4">
          <Card.Body className="p-4 text-center">
            <h2>Assessment Completed!</h2>
            <p className="lead mb-4">Thank you for completing the assessment.</p>
            
            <Row className="justify-content-center mb-4">
              <Col md={6}>
                <Card className="bg-light border-0">
                  <Card.Body>
                    <h3 className="mb-3">Your Score</h3>
                    <div className="display-4 mb-3">
                      {score} / {maxScore}
                    </div>
                    <p className="mb-3">
                      Correct answers: {correctAnswers} of {totalQuestions}
                    </p>
                    <p className="mb-3">
                      Percentage: {percentage.toFixed(1)}%
                    </p>
                    <ProgressBar 
                      now={percentage} 
                      variant={
                        percentage >= 70 ? "success" : 
                        percentage >= 40 ? "warning" : "danger"
                      }
                      className="mb-3"
                    />
                    <p>
                      {percentage >= 70 ? "Excellent work!" : 
                       percentage >= 40 ? "Good effort!" : "Keep studying!"}
                    </p>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
            
            <div className="d-flex justify-content-center gap-3">
              {course && (
                <Button 
                  variant="primary"
                  onClick={() => navigate(`/course/${course.courseId}`)}
                >
                  Return to Course
                </Button>
              )}
              <Button 
                variant="outline-secondary"
                onClick={() => navigate(user.role === "Student" ? "/student-dashboard" : "/instructor-dashboard")}
              >
                Go to Dashboard
              </Button>
            </div>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  // Assessment taking interface
  return (
    <Container className="py-4">
      {viewMode && (
        <div className="mb-4">
          <Button 
            variant="outline-secondary" 
            onClick={() => navigate('/assessment-management')}
          >
            ← Back to Assessment Management
          </Button>
        </div>
      )}
      
      <Card className="shadow-sm border-0 mb-4">
        <Card.Body className="p-4">
          <h2>{assessment.title}</h2>
          {course && (
            <p className="text-muted">Course: {course.title}</p>
          )}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <span className="badge bg-primary me-2">
                {questions.length} Questions
              </span>
              <span className="badge bg-secondary">
                Max Score: {assessment.maxScore}
              </span>
            </div>
            <div>
              Question {currentQuestion + 1} of {questions.length}
            </div>
          </div>

          {error && (
            <Alert variant="danger" className="mb-4">
              {error}
            </Alert>
          )}

          <ProgressBar 
            now={(currentQuestion / questions.length) * 100} 
            className="mb-4"
          />

          {/* Current Question */}
          <Card className="mb-4 border-0 shadow-sm">
            <Card.Body className="p-4">
              <h4 className="mb-4">
                {questions[currentQuestion]?.text || `Question ${currentQuestion + 1}`}
              </h4>
              
              <Form>
                {questions[currentQuestion]?.options?.map((option, index) => {
                  console.log(`Rendering option ${index}:`, option);
                  const optionText = typeof option === 'object' ? 
                    (option.text || option.value || option.label || `Option ${index + 1}`) : 
                    String(option || `Option ${index + 1}`);
                  
                  return (
                    <Form.Check
                      key={index}
                      type="radio"
                      id={`option-${index}`}
                      name={`question-${currentQuestion}`}
                      label={optionText}
                      checked={answers[currentQuestion] === index}
                      onChange={() => handleAnswerSelect(currentQuestion, index)}
                      className="mb-3"
                    />
                  );
                })}
              </Form>
            </Card.Body>
          </Card>

          {/* Navigation Buttons */}
          <div className="d-flex justify-content-between">
            <Button
              variant="outline-secondary"
              onClick={navigateToPreviousQuestion}
              disabled={currentQuestion === 0}
            >
              Previous
            </Button>

            {currentQuestion < questions.length - 1 ? (
              <Button
                variant="primary"
                onClick={navigateToNextQuestion}
              >
                Next
              </Button>
            ) : (
              <Button
                variant="success"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit Assessment"}
              </Button>
            )}
          </div>
        </Card.Body>
      </Card>

      {/* Question Navigation */}
      <Card className="shadow-sm border-0">
        <Card.Body className="p-4">
          <h5 className="mb-3">Question Navigation</h5>
          <div className="d-flex flex-wrap gap-2">
            {answers.map((answer, index) => (
              <Button
                key={index}
                variant={
                  currentQuestion === index
                    ? "primary"
                    : answer !== null
                    ? "success"
                    : "outline-secondary"
                }
                size="sm"
                onClick={() => setCurrentQuestion(index)}
              >
                {index + 1}
              </Button>
            ))}
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default AssessmentPage
