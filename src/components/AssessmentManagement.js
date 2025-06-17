import { useState, useEffect } from "react";
import { Card, Button, Table } from "react-bootstrap";
import { assessmentService } from "../services/api";
import { useNavigate } from "react-router-dom";

const AssessmentManagement = () => {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      const response = await assessmentService.getAllAssessments();
      setAssessments(response.data || []);
    } catch (error) {
      console.error("Error fetching assessments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewAssessment = (assessmentId) => {
    navigate(`/assessment/edit/${assessmentId}`);
  };

  const handleDeleteAssessment = async (assessmentId) => {
    if (window.confirm("Are you sure you want to delete this assessment?")) {
      try {
        await assessmentService.deleteAssessment(assessmentId);
        fetchAssessments(); // Refresh the list
      } catch (error) {
        console.error("Error deleting assessment:", error);
      }
    }
  };

  return (
    <Card>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Assessment Management</h5>
        <Button variant="primary" onClick={() => navigate("/assessment/create")}>
          Create Assessment
        </Button>
      </Card.Header>
      <Card.Body>
        {loading ? (
          <div className="text-center py-3">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <Table responsive>
            <thead>
              <tr>
                <th>Title</th>
                <th>Course</th>
                <th>Max Score</th>
                <th>Questions</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assessments.map((assessment) => (
                <tr key={assessment.assessmentId}>
                  <td>{assessment.title}</td>
                  <td>{assessment.courseName || "Full Stack Web D."}</td>
                  <td>{assessment.maxScore}</td>
                  <td>
                    {assessment.questions
                      ? typeof assessment.questions === "string"
                        ? `${JSON.parse(assessment.questions).length} questions`
                        : `${assessment.questions.length} questions`
                      : "2 questions"}
                  </td>
                  <td>
                    <div className="d-flex gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleViewAssessment(assessment.assessmentId)}
                      >
                        View
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteAssessment(assessment.assessmentId)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card.Body>
    </Card>
  );
};

export default AssessmentManagement; 