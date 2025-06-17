"use client"

import { useState, useEffect } from "react"
import { Container, Row, Col, Card, Button, Tab, Tabs, Badge, ListGroup, Alert, Spinner } from "react-bootstrap"
import { useParams, Link, useNavigate } from "react-router-dom"
import { courseService, assessmentService, courseMaterialService, fileService } from "../services/api"
import { useAuth } from "../contexts/AuthContext"

const CourseDetailPage = () => {
  const { id } = useParams()
  const [course, setCourse] = useState(null)
  const [assessments, setAssessments] = useState([])
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isEnrolled, setIsEnrolled] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true)
        
        // Fetch course details
        const courseResponse = await courseService.getCourseById(id)
        setCourse(courseResponse.data)
        
        // Check if student is enrolled
        if (user && user.role === "Student") {
          const enrolledCoursesResponse = await courseService.getStudentCourses()
          const enrolledIds = enrolledCoursesResponse.data.map(c => c.courseId)
          const enrolled = enrolledIds.includes(id)
          setIsEnrolled(enrolled)
          
          // If enrolled, fetch materials and assessments
          if (enrolled) {
            console.log("Student is enrolled, fetching materials and assessments")
            try {
              // Fetch course materials
              const materialsResponse = await courseMaterialService.getMaterials(id)
              console.log("Materials response:", materialsResponse)
              setMaterials(materialsResponse.data || [])
              
              // Fetch assessments
              const assessmentsResponse = await assessmentService.getAssessmentsByCourse(id)
              console.log("Assessments response:", assessmentsResponse)
              setAssessments(assessmentsResponse.data || [])
            } catch (err) {
              console.error("Error fetching course content:", err)
            }
          }
        } else if (user && user.role === "Instructor") {
          // For instructors, always fetch materials and assessments
          try {
            // Fetch course materials
            const materialsResponse = await courseMaterialService.getMaterials(id)
            setMaterials(materialsResponse.data || [])
            
            // Fetch assessments
            const assessmentsResponse = await assessmentService.getAssessmentsByCourse(id)
            setAssessments(assessmentsResponse.data || [])
          } catch (err) {
            console.error("Error fetching course content:", err)
          }
        }
      } catch (err) {
        console.error("Error fetching course data:", err)
        setError("Failed to load course information. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchCourseData()
    }
  }, [id, user])

  const handleEnroll = async () => {
    try {
      await courseService.enrollInCourse(id)
      setIsEnrolled(true)
      
      // Reload materials and assessments after enrollment
      try {
        // Fetch course materials
        const materialsResponse = await courseMaterialService.getMaterials(id)
        console.log("Materials after enrollment:", materialsResponse)
        setMaterials(materialsResponse.data || [])
        
        // Fetch assessments
        const assessmentsResponse = await assessmentService.getAssessmentsByCourse(id)
        console.log("Assessments after enrollment:", assessmentsResponse)
        setAssessments(assessmentsResponse.data || [])
      } catch (err) {
        console.error("Error fetching course content after enrollment:", err)
        setError("Enrolled successfully, but failed to load course content. Please refresh the page.")
      }
    } catch (err) {
      console.error("Error enrolling in course:", err)
      setError("Failed to enroll in the course. Please try again.")
    }
  }

  const handleFileDownload = (url, filename) => {
    try {
      fileService.downloadFile(url, filename);
    } catch (err) {
      console.error("Error downloading file:", err);
      setError("Failed to download the file. Please try again.");
    }
  }

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading course details...</p>
      </Container>
    )
  }

  if (!course) {
    return (
      <Container className="py-5 text-center">
        <Alert variant="danger">
          Course not found. The course may have been removed or you don't have permission to view it.
        </Alert>
        <Button 
          variant="primary" 
          onClick={() => navigate("/courses")}
          className="mt-3"
        >
          Back to Courses
        </Button>
      </Container>
    )
  }

  return (
    <Container className="py-4">
      {/* Course Header */}
      <Card className="mb-4 shadow-sm border-0">
        <Row className="g-0">
          {course.mediaUrl && (
            <Col md={4}>
              <img 
                src={course.mediaUrl} 
                alt={course.title} 
                className="img-fluid rounded-start" 
                style={{ height: '100%', objectFit: 'cover' }}
              />
            </Col>
          )}
          <Col md={course.mediaUrl ? 8 : 12}>
            <Card.Body className="p-4">
              <h1 className="card-title">{course.title}</h1>
              <p className="text-muted mb-3">{course.description}</p>

              {user && user.role === "Student" && (
                isEnrolled ? (
                  <Badge bg="success" className="px-3 py-2">Enrolled</Badge>
                ) : (
                  <Button 
                    variant="success" 
                    onClick={handleEnroll}
                  >
                    Enroll in this Course
                  </Button>
                )
              )}
            </Card.Body>
          </Col>
        </Row>
      </Card>

      {error && (
        <Alert variant="danger" className="mb-4">{error}</Alert>
      )}

      {/* Course Content */}
      {(isEnrolled || (user && user.role === "Instructor")) ? (
        <Tabs defaultActiveKey="materials" className="mb-4">
          <Tab eventKey="materials" title="Course Materials">
            {materials.length === 0 ? (
              <Alert variant="info">
                No materials have been added to this course yet.
              </Alert>
            ) : (
              <ListGroup variant="flush">
                {materials.map((material) => (
                  <ListGroup.Item key={material.id} className="d-flex align-items-center py-3">
                    <div className="me-3 fs-4">
                      {fileService.getFileIcon(material.url)}
                    </div>
                    <div className="flex-grow-1">
                      <h5 className="mb-1">{material.title}</h5>
                      <p className="text-muted mb-0 small">
                        {material.fileName || fileService.getFileNameFromUrl(material.url)}
                      </p>
                    </div>
                    <div>
                      {fileService.isPreviewableFile(material.url) ? (
                        <Link 
                          to={material.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="me-2"
                        >
                          <Button variant="outline-primary" size="sm">Preview</Button>
                        </Link>
                      ) : null}
                      <Button 
                        variant="primary" 
                        size="sm"
                        onClick={() => handleFileDownload(
                          material.url, 
                          material.fileName || fileService.getFileNameFromUrl(material.url)
                        )}
                      >
                        Download
                      </Button>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </Tab>
          
          <Tab eventKey="assessments" title="Assessments">
            {assessments.length === 0 ? (
              <Alert variant="info">
                No assessments have been added to this course yet.
              </Alert>
            ) : (
              <ListGroup variant="flush">
                {assessments.map((assessment) => (
                  <ListGroup.Item key={assessment.assessmentId} className="d-flex align-items-center py-3">
                    <div className="me-3 fs-4">📝</div>
                    <div className="flex-grow-1">
                      <h5 className="mb-1">{assessment.title}</h5>
                      <p className="text-muted mb-0 small">
                        Max Score: {assessment.maxScore} points
                      </p>
                    </div>
                    <div>
                      <Link to={`/assessment/${assessment.assessmentId}`}>
                        <Button variant="primary" size="sm">
                          {user.role === "Student" ? "Take Assessment" : "View Assessment"}
                        </Button>
                      </Link>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </Tab>
        </Tabs>
      ) : (
        <Card className="text-center p-4">
          <Card.Body>
            <h4>Enroll to Access Course Content</h4>
            <p className="text-muted">
              You need to enroll in this course to access the course materials and assessments.
            </p>
            {user ? (
              user.role === "Student" ? (
                <Button variant="success" onClick={handleEnroll}>
                  Enroll Now
                </Button>
              ) : (
                <Alert variant="warning">
                  As an instructor, you cannot enroll in courses.
                </Alert>
              )
            ) : (
              <Link to="/login">
                <Button variant="primary">
                  Login to Enroll
                </Button>
              </Link>
            )}
          </Card.Body>
        </Card>
      )}
    </Container>
  )
}

export default CourseDetailPage
