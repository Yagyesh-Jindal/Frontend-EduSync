"use client"

import { useState, useEffect } from "react"
import { Container, Row, Col, Card, Button, Table, Modal, Form, Tab, Tabs, Alert, Spinner } from "react-bootstrap"
import { courseService, userService, assessmentService } from "../services/api"
import { useAuth } from "../contexts/AuthContext"
import { Link, useNavigate, useLocation } from "react-router-dom"

const InstructorDashboard = () => {
  const [courses, setCourses] = useState([])
  const [stats, setStats] = useState(null)
  const [assessments, setAssessments] = useState([])
  const [showCourseModal, setShowCourseModal] = useState(false)
  const [showAssessmentModal, setShowAssessmentModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [courseForm, setCourseForm] = useState({
    title: "",
    description: "",
    mediaUrl: "",
  })

  const [assessmentForm, setAssessmentForm] = useState({
    title: "",
    courseId: "",
    maxScore: 100,
    questions: [{ text: "", options: ["", "", "", ""], correctOption: 0 }]
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        // Fetch instructor courses
        const coursesResponse = await courseService.getInstructorCourses()
        setCourses(coursesResponse.data)
        
        // Fetch instructor stats
        const statsResponse = await userService.getInstructorStats()
        setStats(statsResponse.data)
      } catch (err) {
        console.error("Error fetching instructor data:", err)
        setError("Failed to load your courses. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Check for URL parameter to open assessment modal
    const searchParams = new URLSearchParams(location.search)
    if (searchParams.get('openAssessmentModal') === 'true') {
      setShowAssessmentModal(true)
    }
  }, [location.search])

  const handleCourseSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError("")
    
    try {
      console.log("Submitting course form:", courseForm)
      
      if (editingCourse) {
        const response = await courseService.updateCourse(editingCourse.courseId, courseForm)
        console.log("Course update response:", response)
      } else {
        const response = await courseService.createCourse(courseForm)
        console.log("Course creation response:", response)
      }

      setShowCourseModal(false)
      setCourseForm({ title: "", description: "", mediaUrl: "" })
      setEditingCourse(null)
      await fetchData()
    } catch (error) {
      console.error("Error saving course:", error)
      if (error.response) {
        console.error("Error response data:", error.response.data)
        console.error("Error response status:", error.response.status)
        setError(`Failed to save course. Server returned: ${error.response.status} ${error.response.statusText}`)
      } else if (error.request) {
        console.error("No response received:", error.request)
        setError("Failed to save course. No response received from server.")
      } else {
        setError(`Failed to save course: ${error.message}`)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditCourse = (course) => {
    setEditingCourse(course)
    setCourseForm({
      title: course.title,
      description: course.description,
      mediaUrl: course.mediaUrl || "",
    })
    setShowCourseModal(true)
  }

  const handleDeleteCourse = async (courseId) => {
    if (window.confirm("Are you sure you want to delete this course?")) {
      try {
        await courseService.deleteCourse(courseId)
        fetchData()
      } catch (error) {
        console.error("Error deleting course:", error)
        setError("Failed to delete course. Please try again.")
      }
    }
  }

  const handleAssessmentSubmit = async (e) => {
    e.preventDefault()
    try {
      // Convert questions to JSON string for backend
      const formattedAssessment = {
        title: assessmentForm.title,
        courseId: assessmentForm.courseId,
        maxScore: assessmentForm.maxScore,
        questions: JSON.stringify(assessmentForm.questions)
      }
      
      await assessmentService.createAssessment(formattedAssessment)
      setShowAssessmentModal(false)
      setAssessmentForm({
        title: "",
        courseId: "",
        maxScore: 100,
        questions: [{ text: "", options: ["", "", "", ""], correctOption: 0 }]
      })
      fetchData()
    } catch (error) {
      console.error("Error saving assessment:", error)
      setError("Failed to save assessment. Please try again.")
    }
  }

  const addQuestion = () => {
    setAssessmentForm({
      ...assessmentForm,
      questions: [
        ...assessmentForm.questions,
        { text: "", options: ["", "", "", ""], correctOption: 0 }
      ]
    })
  }

  const removeQuestion = (index) => {
    const updatedQuestions = [...assessmentForm.questions]
    updatedQuestions.splice(index, 1)
    setAssessmentForm({
      ...assessmentForm,
      questions: updatedQuestions
    })
  }

  const updateQuestion = (index, field, value) => {
    const updatedQuestions = [...assessmentForm.questions]
    if (field === "option") {
      const [optionIndex, optionValue] = value
      updatedQuestions[index].options[optionIndex] = optionValue
    } else if (field === "correctOption") {
      updatedQuestions[index].correctOption = parseInt(value)
    } else {
      updatedQuestions[index][field] = value
    }
    
    setAssessmentForm({
      ...assessmentForm,
      questions: updatedQuestions
    })
  }

  const handleDeleteAssessment = async (assessmentId) => {
    if (window.confirm("Are you sure you want to delete this assessment?")) {
      try {
        await assessmentService.deleteAssessment(assessmentId)
        fetchData()
      } catch (error) {
        console.error("Error deleting assessment:", error)
        setError("Failed to delete assessment. Please try again.")
      }
    }
  }

  const handleViewAssessment = (assessmentId) => {
    // Navigate to assessment edit page
    navigate(`/assessment/edit/${assessmentId}`)
  }

  const fetchData = async () => {
    try {
      const [coursesResponse, statsResponse, assessmentsResponse] = await Promise.all([
        courseService.getInstructorCourses(),
        userService.getInstructorStats(),
        assessmentService.getAllAssessments()
      ])

      // Get the courses and assessments
      const fetchedCourses = coursesResponse.data || []
      const fetchedAssessments = assessmentsResponse.data || []
      
      // Calculate assessment counts for each course
      const coursesWithCounts = fetchedCourses.map(course => {
        const assessmentCount = fetchedAssessments.filter(
          assessment => assessment.courseId === course.courseId
        ).length
        
        return {
          ...course,
          assessmentCount
        }
      })

      setCourses(coursesWithCounts)
      setStats(statsResponse.data)
      setAssessments(fetchedAssessments)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      setError("Failed to load your dashboard. Please try again later.")
    }
  }

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading your dashboard...</p>
      </Container>
    )
  }

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1>Instructor Dashboard</h1>
              <p className="text-muted">Welcome back, {user?.name}!</p>
            </div>
            <Button variant="success" onClick={() => setShowCourseModal(true)}>
              Create New Course
            </Button>
          </div>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger">{error}</Alert>
      )}

      {/* Instructor Stats Card */}
      {stats && (
        <Row className="mb-4">
          <Col>
            <Card className="shadow-sm border-0">
              <Card.Body>
                <h5>Instructor Statistics</h5>
                <Row>
                  <Col md={3} className="border-end text-center mb-3 mb-md-0">
                    <h3>{stats.totalStudents}</h3>
                    <small className="text-muted">Total Students</small>
                  </Col>
                  <Col md={3} className="border-end text-center mb-3 mb-md-0">
                    <h3>{stats.totalAssessments}</h3>
                    <small className="text-muted">Total Assessments</small>
                  </Col>
                  <Col md={3} className="border-end text-center mb-3 mb-md-0">
                    <h3>{stats.pendingGrading}</h3>
                    <small className="text-muted">Pending Grades</small>
                  </Col>
                  <Col md={3} className="text-center">
                    <h3>{courses.length}</h3>
                    <small className="text-muted">Active Courses</small>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* My Courses Section */}
      <h4 className="mb-3">My Courses</h4>
      {courses.length === 0 ? (
        <Card className="text-center p-4 shadow-sm">
          <Card.Body>
            <p>You haven't created any courses yet.</p>
            <Button variant="primary" onClick={() => setShowCourseModal(true)}>
              Create Your First Course
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-4">
          {courses.map((course) => (
            <Col key={course.courseId}>
              <Card className="h-100 shadow-sm hover-card">
                {course.mediaUrl && (
                  <Card.Img 
                    variant="top" 
                    src={course.mediaUrl} 
                    alt={course.title}
                    style={{ height: '140px', objectFit: 'cover' }}
                  />
                )}
                <Card.Body className="d-flex flex-column">
                  <Card.Title>{course.title}</Card.Title>
                  <Card.Text className="text-muted small mb-2">
                    {course.description.substring(0, 100)}
                    {course.description.length > 100 ? "..." : ""}
                  </Card.Text>
                  <div className="mt-auto pt-3 d-flex gap-2">
                    <Link to={`/course-management/${course.courseId}`} className="flex-grow-1">
                      <Button variant="primary" className="w-100">Manage Course</Button>
                    </Link>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Create Course Modal */}
      <Modal show={showCourseModal} onHide={() => !submitting && setShowCourseModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editingCourse ? "Edit Course" : "Create New Course"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form onSubmit={handleCourseSubmit}>
            <Form.Group className="mb-3" controlId="courseTitle">
              <Form.Label>Course Title</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={courseForm.title}
                onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                required
                disabled={submitting}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="courseDescription">
              <Form.Label>Course Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={courseForm.description}
                onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                required
                disabled={submitting}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="courseImage">
              <Form.Label>Course Image URL (optional)</Form.Label>
              <Form.Control
                type="url"
                name="mediaUrl"
                value={courseForm.mediaUrl}
                onChange={(e) => setCourseForm({ ...courseForm, mediaUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
                disabled={submitting}
              />
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button 
                variant="secondary" 
                onClick={() => setShowCourseModal(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                type="submit"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    {editingCourse ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  editingCourse ? "Update Course" : "Create Course"
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Assessment Modal */}
      <Modal show={showAssessmentModal} onHide={() => setShowAssessmentModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Create New Assessment</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAssessmentSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Assessment Title</Form.Label>
              <Form.Control
                type="text"
                value={assessmentForm.title}
                onChange={(e) => setAssessmentForm({ ...assessmentForm, title: e.target.value })}
                placeholder="Enter assessment title"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Max Score</Form.Label>
              <Form.Control
                type="number"
                min="1"
                max="100"
                value={assessmentForm.maxScore}
                onChange={(e) => setAssessmentForm({ ...assessmentForm, maxScore: parseInt(e.target.value) })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Select Course</Form.Label>
              <Form.Select
                value={assessmentForm.courseId}
                onChange={(e) => setAssessmentForm({ ...assessmentForm, courseId: e.target.value })}
                required
              >
                <option value="">Select a course</option>
                {courses.map((course) => (
                  <option key={course.courseId} value={course.courseId}>
                    {course.title}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <hr className="my-4" />
            <h5>Questions</h5>

            {assessmentForm.questions.map((question, qIndex) => (
              <div key={qIndex} className="assessment-question mb-4 p-3 border rounded">
                <div className="d-flex justify-content-between mb-2">
                  <h6>Question {qIndex + 1}</h6>
                  {assessmentForm.questions.length > 1 && (
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      onClick={() => removeQuestion(qIndex)}
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <Form.Group className="mb-3">
                  <Form.Control
                    type="text"
                    value={question.text}
                    onChange={(e) => updateQuestion(qIndex, "text", e.target.value)}
                    placeholder="Enter question text"
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
                        checked={question.correctOption === oIndex}
                        onChange={() => updateQuestion(qIndex, "correctOption", oIndex)}
                        className="me-2"
                      />
                      <Form.Control
                        type="text"
                        value={option}
                        onChange={(e) => updateQuestion(qIndex, "option", [oIndex, e.target.value])}
                        placeholder={`Option ${oIndex + 1}`}
                        required
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="text-center">
              <Button variant="outline-primary" onClick={addQuestion}>
                Add Question
              </Button>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAssessmentModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Create Assessment
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  )
}

export default InstructorDashboard
