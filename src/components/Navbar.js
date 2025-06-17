"use client"
import { Navbar, Nav, Container, NavDropdown } from "react-bootstrap"
import { LinkContainer } from "react-router-bootstrap"
import { useAuth } from "../contexts/AuthContext"

const MainNavbar = () => {
  const { user, logout } = useAuth()

  // Custom styles for dropdown
  const dropdownStyles = {
    menu: {
      minWidth: "300px",
      right: 0,
      left: "auto",
      padding: "0.5rem 0",
      boxShadow: "0 0.5rem 1rem rgba(0, 0, 0, 0.15)"
    },
    item: {
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      padding: "10px 16px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    },
    label: {
      fontWeight: "600",
      marginRight: "8px"
    },
    value: {
      maxWidth: "180px",
      overflow: "hidden",
      textOverflow: "ellipsis"
    },
    userToggle: {
      display: "flex",
      alignItems: "center",
      padding: "6px 12px",
      borderRadius: "50px",
      background: "rgba(255, 255, 255, 0.1)",
      color: "white",
      border: "none",
      transition: "all 0.2s ease",
      marginLeft: "10px"
    },
    avatar: {
      width: "30px",
      height: "30px",
      borderRadius: "50%",
      backgroundColor: "#6c5ce7",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      marginRight: "10px",
      fontSize: "14px",
      fontWeight: "bold",
      color: "white"
    }
  }

  // Get user initials for avatar
  const getInitials = (name) => {
    if (!name || name === 'User') return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
      <Container>
        <LinkContainer to="/">
          <Navbar.Brand>
            <strong>EduSync</strong> LMS
          </Navbar.Brand>
        </LinkContainer>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <LinkContainer to="/">
              <Nav.Link>Home</Nav.Link>
            </LinkContainer>
            
            <LinkContainer to="/courses">
              <Nav.Link>All Courses</Nav.Link>
            </LinkContainer>
            
            {user && user.role === "Student" && (
              <>
                <LinkContainer to="/student-dashboard">
                  <Nav.Link>My Dashboard</Nav.Link>
                </LinkContainer>
              </>
            )}
            
            {user && user.role === "Instructor" && (
              <>
                <LinkContainer to="/instructor-dashboard">
                  <Nav.Link>My Dashboard</Nav.Link>
                </LinkContainer>
                <LinkContainer to="/assessment-management">
                  <Nav.Link>Assessments</Nav.Link>
                </LinkContainer>
              </>
            )}
          </Nav>
          
          <Nav>
            {user ? (
              <NavDropdown title={user.name || "Account"} id="user-dropdown" align="end">
                <NavDropdown.Item disabled>
                  {user.role}
                </NavDropdown.Item>
                <NavDropdown.Divider />
                {user.role === "Student" && (
                  <LinkContainer to="/student-dashboard">
                    <NavDropdown.Item>My Dashboard</NavDropdown.Item>
                  </LinkContainer>
                )}
                {user.role === "Instructor" && (
                  <LinkContainer to="/instructor-dashboard">
                    <NavDropdown.Item>My Dashboard</NavDropdown.Item>
                  </LinkContainer>
                )}
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={logout}>Logout</NavDropdown.Item>
              </NavDropdown>
            ) : (
              <>
                <LinkContainer to="/login">
                  <Nav.Link>Login</Nav.Link>
                </LinkContainer>
                <LinkContainer to="/register">
                  <Nav.Link>Register</Nav.Link>
                </LinkContainer>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  )
}

export default MainNavbar
