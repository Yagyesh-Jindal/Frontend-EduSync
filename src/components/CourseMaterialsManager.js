import { useState, useEffect } from "react";
import { Form, Button, Alert, ListGroup, Card, Tabs, Tab, Badge } from "react-bootstrap";
import { courseMaterialService, fileService } from "../services/api";

const CourseMaterialsManager = ({ courseId, existingMaterials = [], onMaterialsUpdate }) => {
  const [materials, setMaterials] = useState(existingMaterials);
  const [newMaterial, setNewMaterial] = useState({
    title: "",
    type: "PDF Document",
    url: ""
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("url");

  // Fetch materials when component mounts or courseId changes
  useEffect(() => {
    if (courseId) {
      fetchMaterials();
    }
  }, [courseId]);

  const fetchMaterials = async () => {
    try {
      setIsLoading(true);
      const response = await courseMaterialService.getMaterials(courseId);
      console.log("Fetched materials:", response.data);
      setMaterials(response.data || []);
      
      // Notify parent component
      if (onMaterialsUpdate) {
        onMaterialsUpdate(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching materials:", error);
      setError("Failed to load course materials. Please refresh the page.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewMaterial({
      ...newMaterial,
      [name]: value
    });
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      // Auto-fill title if empty
      if (!newMaterial.title.trim()) {
        const fileName = e.target.files[0].name.split('.').slice(0, -1).join('.');
        setNewMaterial({
          ...newMaterial,
          title: fileName
        });
      }
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file to upload");
      return;
    }

    if (!newMaterial.title.trim()) {
      setError("Please provide a title for the material");
      return;
    }

    setIsUploading(true);
    setError("");
    setSuccess("");

    try {
      // Upload file to Azure Blob Storage
      const uploadResponse = await fileService.uploadFile(selectedFile, "course");
      console.log("File uploaded:", uploadResponse.data);

      // Add material with the uploaded file URL
      const materialToAdd = {
        ...newMaterial,
        url: uploadResponse.data.url
      };

      const response = await courseMaterialService.addMaterial(courseId, materialToAdd);
      console.log("Material added response:", response.data);
      
      // Update local state
      const addedMaterial = response.data;
      const updatedMaterials = [...materials, addedMaterial];
      setMaterials(updatedMaterials);
      
      // Notify parent component
      if (onMaterialsUpdate) {
        onMaterialsUpdate(updatedMaterials);
      }
      
      // Reset form
      setNewMaterial({
        title: "",
        type: "PDF Document",
        url: ""
      });
      setSelectedFile(null);
      document.getElementById('fileInput').value = '';
      
      setSuccess("Material uploaded and added successfully!");
    } catch (error) {
      console.error("Error uploading file:", error);
      setError(error.message || "Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      // Validate inputs
      if (!newMaterial.title.trim()) {
        throw new Error("Title is required");
      }
      
      if (!newMaterial.url.trim()) {
        throw new Error("URL is required");
      }
      
      console.log("Adding material:", newMaterial);
      const response = await courseMaterialService.addMaterial(courseId, newMaterial);
      console.log("Material added response:", response.data);
      
      // Update local state
      const addedMaterial = response.data;
      const updatedMaterials = [...materials, addedMaterial];
      setMaterials(updatedMaterials);
      
      // Notify parent component
      if (onMaterialsUpdate) {
        onMaterialsUpdate(updatedMaterials);
      }
      
      // Reset form
      setNewMaterial({
        title: "",
        type: "PDF Document",
        url: ""
      });
      
      setSuccess("Material added successfully!");
    } catch (error) {
      console.error("Error adding material:", error);
      setError(error.message || "Failed to add material. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMaterial = async (materialId) => {
    if (!window.confirm("Are you sure you want to delete this material?")) {
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      await courseMaterialService.deleteMaterial(courseId, materialId);
      console.log("Material deleted:", materialId);
      
      // Update local state
      const updatedMaterials = materials.filter(m => m.id !== materialId);
      setMaterials(updatedMaterials);
      
      // Notify parent component
      if (onMaterialsUpdate) {
        onMaterialsUpdate(updatedMaterials);
      }
      
      setSuccess("Material deleted successfully!");
    } catch (error) {
      console.error("Error deleting material:", error);
      setError("Failed to delete material. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getMaterialIcon = (materialType) => {
    switch (materialType) {
      case 'PDF Document':
        return '📄';
      case 'Video':
        return '🎬';
      case 'Presentation':
        return '📊';
      case 'Assignment':
        return '📝';
      default:
        return '📁';
    }
  };

  const getFileExtension = (url) => {
    if (!url) return null;
    const extension = url.split('.').pop().toLowerCase();
    return extension;
  };

  const isPreviewable = (url) => {
    if (!url) return false;
    const extension = getFileExtension(url);
    return ['pdf', 'jpg', 'jpeg', 'png', 'gif'].includes(extension);
  };

  return (
    <div className="course-materials-manager">
      <h5 className="mb-3">Course Materials</h5>
      
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      
      <Card className="mb-4">
        <Card.Header>
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-3"
          >
            <Tab eventKey="upload" title="Upload File">
              <Form className="p-3">
                <Form.Group className="mb-3">
                  <Form.Label>Title</Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    value={newMaterial.title}
                    onChange={handleInputChange}
                    placeholder="Enter material title"
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Type</Form.Label>
                  <Form.Select
                    name="type"
                    value={newMaterial.type}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="PDF Document">PDF Document</option>
                    <option value="Video">Video</option>
                    <option value="Presentation">Presentation</option>
                    <option value="Assignment">Assignment</option>
                    <option value="Other">Other</option>
                  </Form.Select>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Select File</Form.Label>
                  <Form.Control
                    type="file"
                    id="fileInput"
                    onChange={handleFileChange}
                    required
                  />
                  <Form.Text className="text-muted">
                    Max file size: 10MB. Supported formats: PDF, DOC, DOCX, PPT, PPTX, MP4, etc.
                  </Form.Text>
                </Form.Group>
                
                {isUploading && (
                  <div className="mb-3">
                    <div className="progress">
                      <div 
                        className="progress-bar" 
                        role="progressbar" 
                        style={{ width: `${uploadProgress}%` }}
                        aria-valuenow={uploadProgress} 
                        aria-valuemin="0" 
                        aria-valuemax="100">
                        {uploadProgress}%
                      </div>
                    </div>
                  </div>
                )}
                
                <Button 
                  variant="primary" 
                  onClick={handleFileUpload}
                  disabled={isUploading || !selectedFile}
                >
                  {isUploading ? "Uploading..." : "Upload & Add Material"}
                </Button>
              </Form>
            </Tab>
            <Tab eventKey="url" title="Add URL">
              <Form onSubmit={handleAddMaterial} className="p-3">
                <Form.Group className="mb-3">
                  <Form.Label>Title</Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    value={newMaterial.title}
                    onChange={handleInputChange}
                    placeholder="Enter material title"
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Type</Form.Label>
                  <Form.Select
                    name="type"
                    value={newMaterial.type}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="PDF Document">PDF Document</option>
                    <option value="Video">Video</option>
                    <option value="Presentation">Presentation</option>
                    <option value="Assignment">Assignment</option>
                    <option value="Other">Other</option>
                  </Form.Select>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>URL</Form.Label>
                  <Form.Control
                    type="url"
                    name="url"
                    value={newMaterial.url}
                    onChange={handleInputChange}
                    placeholder="Enter material URL"
                    required
                  />
                  <Form.Text className="text-muted">
                    Enter a direct URL to your material (e.g., Google Drive, Dropbox, or other hosting service)
                  </Form.Text>
                </Form.Group>
                
                <Button 
                  type="submit" 
                  variant="primary" 
                  disabled={isLoading}
                >
                  {isLoading ? "Adding..." : "Add Material"}
                </Button>
              </Form>
            </Tab>
          </Tabs>
        </Card.Header>
      </Card>
      
      <h6>Existing Materials</h6>
      {isLoading ? (
        <div className="text-center py-3">
          <div className="spinner-border spinner-border-sm text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : materials.length === 0 ? (
        <Card className="text-center p-3">
          <p className="text-muted mb-0">No materials added yet</p>
        </Card>
      ) : (
        <ListGroup>
          {materials.map((material) => (
            <ListGroup.Item 
              key={material.id} 
              className="d-flex justify-content-between align-items-center"
            >
              <div>
                <div className="d-flex align-items-center">
                  <span className="me-2" style={{ fontSize: '1.5rem' }}>
                    {getMaterialIcon(material.type)}
                  </span>
                  <div>
                    <strong>{material.title}</strong>
                    <br />
                    <small className="text-muted">
                      {material.type} 
                      {material.uploadedAt && (
                        <span> • Uploaded: {new Date(material.uploadedAt).toLocaleDateString()}</span>
                      )}
                    </small>
                  </div>
                </div>
              </div>
              <div>
                {isPreviewable(material.url) ? (
                  <Button 
                    variant="outline-primary"
                    size="sm"
                    className="me-2"
                    onClick={() => window.open(material.url, '_blank')}
                  >
                    Preview
                  </Button>
                ) : (
                  <Button 
                    variant="outline-primary"
                    size="sm"
                    className="me-2"
                    as="a"
                    href={material.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                  >
                    Download
                  </Button>
                )}
                <Button 
                  variant="outline-danger" 
                  size="sm"
                  onClick={() => handleDeleteMaterial(material.id)}
                  disabled={isLoading}
                >
                  Remove
                </Button>
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
    </div>
  );
};

export default CourseMaterialsManager; 