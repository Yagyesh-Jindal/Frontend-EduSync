"use client"

import { useState, useEffect } from "react"
import { Container, Row, Col, Card, Button, ProgressBar, Tab, Tabs, Alert, Spinner, Badge } from "react-bootstrap"
import { Link } from "react-router-dom"
import { courseService, userService } from "../services/api"
import { useAuth } from "../contexts/AuthContext"

const StudentDashboard = () => {
  const [enrolledCourses, setEnrolledCourses] = useState([])
  const [availableCourses, setAvailableCourses] = useState([])
  const [recentAssessments, setRecentAssessments] = useState([])
  const [progress, setProgress] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const { user } = useAuth()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        // Fetch enrolled courses
        const coursesResponse = await courseService.getStudentCourses()
        setEnrolledCourses(coursesResponse.data)
        
        // Fetch student progress
        const progressResponse = await userService.getStudentProgress()
        setProgress(progressResponse.data)
      } catch (err) {
        console.error("Error fetching student data:", err)
        setError("Failed to load your courses. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleEnroll = async (courseId) => {
    try {
      await courseService.enrollInCourse(courseId)
      fetchDashboardData() // Refresh data
    } catch (error) {
      console.error("Error enrolling in course:", error)
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
          <h1>Student Dashboard</h1>
          <p className="text-muted">Welcome back, {user?.name}!</p>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger">{error}</Alert>
      )}

      {/* Progress Summary Card */}
      {progress && (
        <Row className="mb-4">
          <Col>
            <Card className="shadow-sm border-0">
              <Card.Body>
                <h5>Your Learning Progress</h5>
                <Row>
                  <Col md={3} className="border-end text-center mb-3 mb-md-0">
                    <h3>{progress.completedAssessments}</h3>
                    <small className="text-muted">Assessments Completed</small>
                  </Col>
                  <Col md={3} className="border-end text-center mb-3 mb-md-0">
                    <h3>{progress.averageScore}%</h3>
                    <small className="text-muted">Average Score</small>
                  </Col>
                  <Col md={3} className="border-end text-center mb-3 mb-md-0">
                    <h3>{progress.studyHours}</h3>
                    <small className="text-muted">Study Hours</small>
                  </Col>
                  <Col md={3} className="text-center">
                    <h3>{enrolledCourses.length}</h3>
                    <small className="text-muted">Enrolled Courses</small>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Enrolled Courses */}
      <h4 className="mb-3">My Courses</h4>
      {enrolledCourses.length === 0 ? (
        <Card className="text-center p-4 shadow-sm">
          <Card.Body>
            <p>You are not enrolled in any courses yet.</p>
            <Link to="/courses">
              <Button variant="primary">Browse Courses</Button>
            </Link>
          </Card.Body>
        </Card>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-4">
          {enrolledCourses.map((course) => (
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
                  <div className="mt-auto pt-3">
                    <Link to={`/course/${course.courseId}`}>
                      <Button variant="primary" className="w-100">View Course</Button>
                    </Link>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  )
}

export default StudentDashboard
