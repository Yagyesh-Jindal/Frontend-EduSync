import { Container, Row, Col, Card } from "react-bootstrap"

const AboutPage = () => {
  return (
    <Container className="py-4">
      <Row className="mb-5">
        <Col>
          <h1 className="text-center mb-4">About EduSync LMS</h1>
          <Card className="shadow-sm border-0">
            <Card.Body className="p-4">
              <p className="lead">
                EduSync is a modern Learning Management System designed to facilitate seamless 
                interaction between instructors and students in an educational environment.
              </p>
              <p>
                Our platform provides a comprehensive set of tools for course creation, content management,
                assessment administration, and student progress tracking. With an intuitive interface and
                powerful features, EduSync enhances the teaching and learning experience for all users.
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-5">
        <Col>
          <h2 className="text-center mb-4">Our Mission</h2>
          <Card className="shadow-sm border-0">
            <Card.Body className="p-4">
              <p>
                At EduSync, our mission is to make education more accessible, interactive, and effective.
                We believe that technology should enhance the educational experience, not complicate it.
                That's why we've built a platform that is intuitive for both instructors and students,
                allowing them to focus on what matters most: teaching and learning.
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={6} className="mb-4">
          <h3 className="mb-3">For Instructors</h3>
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <ul>
                <li>Create and manage courses with ease</li>
                <li>Upload and organize course materials</li>
                <li>Create assessments and track student performance</li>
                <li>Communicate with enrolled students</li>
                <li>Generate reports on student progress</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6} className="mb-4">
          <h3 className="mb-3">For Students</h3>
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <ul>
                <li>Access course materials anytime, anywhere</li>
                <li>Take assessments and view results immediately</li>
                <li>Track your progress across all enrolled courses</li>
                <li>Download course materials for offline study</li>
                <li>Engage with instructors and course content</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-5">
        <Col>
          <Card className="shadow-sm border-0 bg-light">
            <Card.Body className="p-4 text-center">
              <h4>Contact Information</h4>
              <p>For any questions or support needs, please contact us at:</p>
              <p><strong>Email:</strong> support@edusync.com</p>
              <p><strong>Phone:</strong> (123) 456-7890</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default AboutPage
