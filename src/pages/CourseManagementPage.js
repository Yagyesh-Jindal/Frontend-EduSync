import { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Form, Alert, Spinner, Tab, Tabs, ListGroup, Modal } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import { courseService, courseMaterialService, assessmentService, fileService } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const CourseManagementPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [materialsLoading, setMaterialsLoading] = useState(false);
  
  // Course edit form
  const [editMode, setEditMode] = useState(false);
  const [courseForm, setCourseForm] = useState({
    title: "",
    description: "",
    mediaUrl: ""
  });
  
  // Material upload modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: "",
    file: null,
    uploading: false
  });

  // Assessment modal
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);
        setError("");
        
        // Fetch course details
        const courseResponse = await courseService.getCourseById(id);
        const courseData = courseResponse.data;
        setCourse(courseData);
        setCourseForm({
          title: courseData.title,
          description: courseData.description,
          mediaUrl: courseData.mediaUrl || ""
        });
        
        // Fetch course materials
        await fetchMaterials();
        
        // Fetch assessments
        const assessmentsResponse = await assessmentService.getAssessmentsByCourse(id);
        setAssessments(assessmentsResponse.data || []);
      } catch (err) {
        console.error("Error fetching course data:", err);
        if (err.response) {
          console.error("Error response data:", err.response.data);
          console.error("Error response status:", err.response.status);
          setError(`Failed to load course information. Server error: ${err.response.status} ${err.response.statusText}`);
        } else if (err.request) {
          console.error("No response received:", err.request);
          setError("Failed to load course information. No response received from server.");
        } else {
          setError(`Failed to load course information: ${err.message}`);
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCourseData();
    }
  }, [id]);

  const fetchMaterials = async () => {
    try {
      setMaterialsLoading(true);
      console.log("Fetching materials for course ID:", id);
      const materialsResponse = await courseMaterialService.getMaterials(id);
      console.log("Materials response:", materialsResponse);
      setMaterials(materialsResponse.data || []);
    } catch (err) {
      console.error("Error fetching materials:", err);
      if (err.response) {
        console.error("Materials error response data:", err.response.data);
        console.error("Materials error response status:", err.response.status);
      }
      // Don't set error state here to avoid overriding other errors
    } finally {
      setMaterialsLoading(false);
    }
  };

  const handleCourseUpdate = async (e) => {
    e.preventDefault();
    try {
      setError("");
      await courseService.updateCourse(id, courseForm);
      setCourse({
        ...course,
        ...courseForm
      });
      setSuccess("Course updated successfully!");
      setEditMode(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error("Error updating course:", err);
      if (err.response) {
        setError(`Failed to update course. Server error: ${err.response.status} ${err.response.statusText}`);
      } else if (err.request) {
        setError("Failed to update course. No response received from server.");
      } else {
        setError(`Failed to update course: ${err.message}`);
      }
    }
  };

  const handleFileChange = (e) => {
    setUploadForm({
      ...uploadForm,
      file: e.target.files[0]
    });
  };

  const handleUploadMaterial = async (e) => {
    e.preventDefault();
    
    if (!uploadForm.title || !uploadForm.file) {
      setError("Please provide a title and select a file to upload.");
      return;
    }
    
    try {
      setUploadForm({ ...uploadForm, uploading: true });
      
      // First upload the file
      const fileResponse = await fileService.uploadFile(uploadForm.file, "course");
      
      // Then create the course material with the file URL
      const materialData = {
        title: uploadForm.title,
        type: uploadForm.file.type,
        url: fileResponse.data.url,
        fileName: uploadForm.file.name
      };
      
      await courseMaterialService.addMaterial(id, materialData);
      
      // Refresh materials list
      await fetchMaterials();
      
      // Reset form and close modal
      setUploadForm({
        title: "",
        file: null,
        uploading: false
      });
      setShowUploadModal(false);
      setSuccess("Material uploaded successfully!");
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error("Error uploading material:", err);
      setError("Failed to upload material. Please try again.");
      setUploadForm({ ...uploadForm, uploading: false });
    }
  };

  const handleManualMaterialAdd = () => {
    // This is a temporary workaround for the backend issue
    const tempMaterial = {
      id: Date.now().toString(), // Temporary ID
      title: uploadForm.title,
      type: uploadForm.file ? uploadForm.file.type : "application/pdf",
      fileName: uploadForm.file ? uploadForm.file.name : "document.pdf",
      url: "#", // Placeholder URL
      uploadedAt: new Date().toISOString()
    };
    
    // Add to local state
    setMaterials([...materials, tempMaterial]);
    
    // Reset form and close modal
    setUploadForm({
      title: "",
      file: null,
      uploading: false
    });
    setShowUploadModal(false);
    setSuccess("Material added to course (temporary). Backend storage is currently unavailable.");
    
    // Clear success message after 5 seconds
    setTimeout(() => {
      setSuccess("");
    }, 5000);
  };

  const handleDeleteMaterial = async (materialId) => {
    if (window.confirm("Are you sure you want to delete this material?")) {
      try {
        await courseMaterialService.deleteMaterial(id, materialId);
        setMaterials(materials.filter(m => m.id !== materialId));
        setSuccess("Material deleted successfully!");
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccess("");
        }, 3000);
      } catch (err) {
        console.error("Error deleting material:", err);
        setError("Failed to delete material. Please try again.");
      }
    }
  };

  const createNewAssessment = () => {
    navigate(`/assessment/create?courseId=${id}`);
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading course management...</p>
      </Container>
    );
  }

  // Redirect if not an instructor or if the course doesn't belong to this instructor
  if (!user || user.role !== "Instructor") {
    return (
      <Container className="py-5 text-center">
        <Alert variant="danger">
          You do not have permission to manage this course.
        </Alert>
        <Button 
          variant="primary" 
          onClick={() => navigate("/courses")}
          className="mt-3"
        >
          Back to Courses
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h1>Course Management</h1>
            <div>
              <Button 
                variant="outline-primary" 
                className="me-2"
                onClick={() => navigate(`/course/${id}`)}
              >
                View Course
              </Button>
              <Button 
                variant={editMode ? "success" : "primary"} 
                onClick={() => setEditMode(!editMode)}
              >
                {editMode ? "Save Changes" : "Edit Course"}
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" className="mb-4" onClose={() => setError("")} dismissible>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" className="mb-4" onClose={() => setSuccess("")} dismissible>
          {success}
        </Alert>
      )}

      {/* Course Details Section */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          {editMode ? (
            <Form onSubmit={handleCourseUpdate}>
              <Form.Group className="mb-3" controlId="courseTitle">
                <Form.Label>Course Title</Form.Label>
                <Form.Control
                  type="text"
                  value={courseForm.title}
                  onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="courseDescription">
                <Form.Label>Course Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="courseImage">
                <Form.Label>Course Image URL (optional)</Form.Label>
                <Form.Control
                  type="url"
                  value={courseForm.mediaUrl}
                  onChange={(e) => setCourseForm({ ...courseForm, mediaUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
                {courseForm.mediaUrl && (
                  <div className="mt-2">
                    <img 
                      src={courseForm.mediaUrl} 
                      alt="Course preview" 
                      style={{ maxHeight: "200px", maxWidth: "100%" }} 
                    />
                  </div>
                )}
              </Form.Group>

              <div className="d-flex justify-content-end gap-2">
                <Button variant="secondary" onClick={() => setEditMode(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Save Changes
                </Button>
              </div>
            </Form>
          ) : (
            <div>
              <h2>{course?.title}</h2>
              <p className="text-muted">{course?.description}</p>
              {course?.mediaUrl && (
                <img 
                  src={course.mediaUrl} 
                  alt={course.title} 
                  style={{ maxHeight: "200px", maxWidth: "100%" }} 
                  className="mt-3" 
                />
              )}
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Course Content Management */}
      <Tabs defaultActiveKey="materials" className="mb-4">
        <Tab eventKey="materials" title="Course Materials">
          <Card className="shadow-sm">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Course Materials</h5>
              <div>
                <Button 
                  variant="outline-primary" 
                  className="me-2" 
                  onClick={fetchMaterials}
                  disabled={materialsLoading}
                >
                  {materialsLoading ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                      Refreshing...
                    </>
                  ) : (
                    "Refresh"
                  )}
                </Button>
                <Button variant="success" onClick={() => setShowUploadModal(true)}>
                  Upload New Material
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              {materialsLoading ? (
                <div className="text-center p-4">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-3">Loading materials...</p>
                </div>
              ) : materials.length === 0 ? (
                <Alert variant="info">
                  No materials have been added to this course yet.
                  <Button 
                    variant="primary" 
                    className="d-block mx-auto mt-3"
                    onClick={() => setShowUploadModal(true)}
                  >
                    Upload Your First Material
                  </Button>
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
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          onClick={() => handleDeleteMaterial(material.id)}
                          className="ms-2"
                        >
                          Delete
                        </Button>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Tab>
        
        <Tab eventKey="assessments" title="Assessments">
          <Card className="shadow-sm">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Course Assessments</h5>
              <Button variant="success" onClick={createNewAssessment}>
                Create New Assessment
              </Button>
            </Card.Header>
            <Card.Body>
              {assessments.length === 0 ? (
                <Alert variant="info">
                  No assessments have been added to this course yet.
                  <Button 
                    variant="primary" 
                    className="d-block mx-auto mt-3"
                    onClick={createNewAssessment}
                  >
                    Create Your First Assessment
                  </Button>
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
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          onClick={() => navigate(`/assessment/edit/${assessment.assessmentId}`)}
                          className="me-2"
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          onClick={() => {
                            if (window.confirm("Are you sure you want to delete this assessment?")) {
                              assessmentService.deleteAssessment(assessment.assessmentId)
                                .then(() => {
                                  setAssessments(assessments.filter(a => a.assessmentId !== assessment.assessmentId));
                                  setSuccess("Assessment deleted successfully!");
                                })
                                .catch(err => {
                                  console.error("Error deleting assessment:", err);
                                  setError("Failed to delete assessment. Please try again.");
                                });
                            }
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      {/* Upload Material Modal */}
      <Modal show={showUploadModal} onHide={() => !uploadForm.uploading && setShowUploadModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Upload Course Material</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && (
            <Alert variant="danger" onClose={() => setError("")} dismissible>
              {error}
            </Alert>
          )}
          
          <Form onSubmit={handleUploadMaterial}>
            <Form.Group className="mb-3">
              <Form.Label>Material Title</Form.Label>
              <Form.Control
                type="text"
                value={uploadForm.title}
                onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                placeholder="Enter a title for this material"
                required
                disabled={uploadForm.uploading}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>File</Form.Label>
              <Form.Control
                type="file"
                onChange={handleFileChange}
                required
                disabled={uploadForm.uploading}
              />
            </Form.Group>
            
            <div className="d-flex justify-content-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setShowUploadModal(false)}
                disabled={uploadForm.uploading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={uploadForm.uploading || !uploadForm.title || !uploadForm.file}
              >
                {uploadForm.uploading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                    Uploading...
                  </>
                ) : (
                  "Upload Material"
                )}
              </Button>
              
              {/* Temporary workaround button */}
              <Button 
                variant="warning" 
                onClick={handleManualMaterialAdd}
                disabled={uploadForm.uploading || !uploadForm.title}
                title="Temporary workaround for backend issues"
              >
                Add Without Upload
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default CourseManagementPage; 