import { Container, Row, Col, Breadcrumb } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import AssessmentManagement from "../components/AssessmentManagement";

const AssessmentManagementPage = () => {
  const { user } = useAuth();

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <Breadcrumb>
            <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/" }}>
              Home
            </Breadcrumb.Item>
            <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/instructor-dashboard" }}>
              Instructor Dashboard
            </Breadcrumb.Item>
            <Breadcrumb.Item active>Assessment Management</Breadcrumb.Item>
          </Breadcrumb>
          
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 className="h3 mb-0">Assessment Management</h1>
              <p className="text-muted">Manage your course assessments here, {user?.name}.</p>
            </div>
          </div>
        </Col>
      </Row>

      <Row>
        <Col>
          <AssessmentManagement />
        </Col>
      </Row>
    </Container>
  );
};

export default AssessmentManagementPage; 