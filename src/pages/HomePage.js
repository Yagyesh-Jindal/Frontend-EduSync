"use client"

import { useState, useEffect } from "react"
import { Container, Row, Col, Button, Card } from "react-bootstrap"
import { Link } from "react-router-dom"
import { courseService } from "../services/api"
import { useAuth } from "../contexts/AuthContext"

const HomePage = () => {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await courseService.getAllCourses()
        setCourses(response.data.slice(0, 6)) // Show only first 6 courses
      } catch (error) {
        console.error("Error fetching courses:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCourses()
  }, [])

  return (
    <div>
      {/* Hero Section */}
      <section className="hero-section">
        <Container>
          <Row className="align-items-center">
            <Col lg={6}>
              <h1 className="display-4 fw-bold mb-4">Transform Your Learning Experience with EduSync</h1>
              <p className="lead mb-4">
                A comprehensive Learning Management System that connects students and instructors in one seamless
                digital environment. Create, learn, and grow together.
              </p>
              <div className="d-flex gap-3">
                {user ? (
                  <Link to={user.role === "Instructor" ? "/instructor-dashboard" : "/student-dashboard"}>
                    <Button variant="light" size="lg">
                      Go to Dashboard
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/register">
                      <Button variant="light" size="lg">
                        Get Started
                      </Button>
                    </Link>
                    <Link to="/login">
                      <Button variant="outline-light" size="lg">
                        Sign In
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </Col>
            <Col lg={6}>
              <div className="text-center">
                <img src="https://www.bu.edu/spark/files/2025/01/edusync-logo-636x407.png" alt="EduSync Platform" className="img-fluid rounded shadow" />
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Features Section */}
      <section className="py-5">
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <h2 className="display-5 fw-bold">Why Choose EduSync?</h2>
              <p className="lead text-muted">Powerful features designed for modern education</p>
            </Col>
          </Row>
          <Row>
            <Col md={4} className="mb-4">
              <Card className="feature-card h-100 text-center p-4">
                <Card.Body>
                  <div className="feature-icon-wrapper mb-4">
                    <i className="bi bi-collection-play fs-1 text-primary"></i>
                  </div>
                  <Card.Title>Course Management</Card.Title>
                  <Card.Text>
                    Create and organize courses with multimedia content, assignments, and comprehensive learning
                    materials.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className="mb-4">
              <Card className="feature-card h-100 text-center p-4">
                <Card.Body>
                  <div className="feature-icon-wrapper mb-4">
                    <i className="bi bi-file-earmark-check fs-1 text-success"></i>
                  </div>
                  <Card.Title>Smart Assessments</Card.Title>
                  <Card.Text>
                    Build interactive assessments with real-time grading and detailed performance analytics.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className="mb-4">
              <Card className="feature-card h-100 text-center p-4">
                <Card.Body>
                  <div className="feature-icon-wrapper mb-4">
                    <i className="bi bi-bar-chart-line fs-1 text-info"></i>
                  </div>
                  <Card.Title>Progress Tracking</Card.Title>
                  <Card.Text>
                    Monitor student progress with comprehensive dashboards and detailed performance insights.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Featured Courses Section */}
      <section className="py-5 bg-light">
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <h2 className="display-5 fw-bold">Featured Courses</h2>
              <p className="lead text-muted">Explore our most popular learning opportunities</p>
            </Col>
          </Row>
          {loading ? (
            <div className="text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading courses...</span>
              </div>
            </div>
          ) : (
            <Row>
              {courses.map((course) => (
                <Col md={4} key={course.courseId} className="mb-4">
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
                      <Card.Text className="flex-grow-1">{course.description?.substring(0, 100)}...</Card.Text>
                      <div className="mt-auto">
                        <small className="text-muted">Instructor: {course.instructorName || "TBA"}</small>
                        <div className="mt-2">
                          <Link to={`/course/${course.courseId}`}>
                            <Button variant="primary" size="sm">
                              Learn More
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
          <Row className="mt-4">
            <Col className="text-center">
              <Link to="/courses">
                <Button variant="outline-primary" size="lg">
                  View All Courses
                </Button>
              </Link>
            </Col>
          </Row>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-5">
        <Container>
          <Row className="text-center">
            <Col>
              <h2 className="display-5 fw-bold mb-4">Ready to Start Learning?</h2>
              <p className="lead mb-4">Join thousands of students and instructors already using EduSync</p>
              {!user && (
                <div className="d-flex justify-content-center gap-3">
                  <Link to="/register">
                    <Button variant="primary" size="lg">
                      Create Free Account
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button variant="outline-primary" size="lg">
                      Sign In
                    </Button>
                  </Link>
                </div>
              )}
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  )
}

export default HomePage
