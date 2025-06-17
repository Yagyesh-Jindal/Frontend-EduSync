"use client"

import { useState, useEffect } from "react"
import { Container, Row, Col, Card, Button, Form, InputGroup } from "react-bootstrap"
import { Link } from "react-router-dom"
import { courseService } from "../services/api"
import { useAuth } from "../contexts/AuthContext"

const CoursesPage = () => {
  const [courses, setCourses] = useState([])
  const [filteredCourses, setFilteredCourses] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    fetchCourses()
  }, [])

  useEffect(() => {
    // Filter courses based on search term
    const filtered = courses.filter(
      (course) =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredCourses(filtered)
  }, [courses, searchTerm])

  const fetchCourses = async () => {
    try {
      const response = await courseService.getAllCourses()
      setCourses(response.data)
      setFilteredCourses(response.data)
    } catch (error) {
      console.error("Error fetching courses:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async (courseId) => {
    try {
      console.log("Attempting to enroll in course:", courseId);
      const response = await courseService.enrollInCourse(courseId);
      console.log("Enrollment successful:", response);
      // Refresh courses to update enrollment status
      fetchCourses();
    } catch (error) {
      console.error("Error enrolling in course:", error);
      console.error("Error details:", error.response?.data);
      // Show error to user
      alert(`Failed to enroll: ${error.response?.data || error.message || "Unknown error"}`);
    }
  }

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading courses...</span>
        </div>
      </div>
    )
  }

  return (
    <Container className="py-5">
      <Row className="mb-4">
        <Col>
          <h1 className="display-4 fw-bold text-center mb-4">All Courses</h1>
          <p className="lead text-center text-muted mb-4">Discover and enroll in courses that match your interests</p>

          {/* Search Bar */}
          <Row className="justify-content-center">
            <Col md={6}>
              <InputGroup className="mb-4">
                <Form.Control
                  type="text"
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button variant="outline-primary">
                  <i className="bi bi-search"></i>
                </Button>
              </InputGroup>
            </Col>
          </Row>
        </Col>
      </Row>

      <Row>
        {filteredCourses.length === 0 ? (
          <Col>
            <Card className="text-center py-5">
              <Card.Body>
                <h5>No Courses Found</h5>
                <p className="text-muted">
                  {searchTerm ? "Try adjusting your search terms." : "No courses are available at the moment."}
                </p>
              </Card.Body>
            </Card>
          </Col>
        ) : (
          filteredCourses.map((course) => (
            <Col md={6} lg={4} key={course.courseId} className="mb-4">
              <Card className="course-card h-100">
                {course.mediaUrl ? (
                  <Card.Img
                    variant="top"
                    src={course.mediaUrl}
                    style={{ height: "200px", objectFit: "cover" }}
                  />
                ) : (
                  <div className="card-img-top course-gradient-bg">
                    {course.title}
                  </div>
                )}
                <Card.Body className="d-flex flex-column">
                  <Card.Title>{course.title}</Card.Title>
                  <Card.Text className="flex-grow-1">{course.description}</Card.Text>
                  <div className="mt-auto">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <small className="text-muted">Instructor: {course.instructorName || "TBA"}</small>
                      <small className="text-muted">{course.enrolledStudents || 0} students</small>
                    </div>
                    <div className="d-flex gap-2">
                      <Link to={`/course/${course.courseId}`}>
                        <Button variant="outline-primary" size="sm">
                          View Details
                        </Button>
                      </Link>
                      {user && user.role === "Student" && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleEnroll(course.courseId)}
                          disabled={course.isEnrolled}
                        >
                          {course.isEnrolled ? "Enrolled" : "Enroll Now"}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))
        )}
      </Row>
    </Container>
  )
}

export default CoursesPage
