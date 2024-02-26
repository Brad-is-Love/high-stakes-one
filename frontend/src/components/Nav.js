import React, { useState } from "react";
import { PersonFill } from "react-bootstrap-icons";
import { Modal, Button, Form } from "react-bootstrap";

export function Nav({ selectedAddress }) {
  const [showModal, setShowModal] = useState(false);
  const handleShow = () => setShowModal(true);
  const handleClose = () => setShowModal(false);
  return (
    <>
      <div className="navbar navbar-expand-lg navbar-dark custom-nav-bg">
        <div className="container-fluid">
          <a className="navbar-brand" href="/">
            High Stakes
          </a>
          <span
            className="navbar-text text-white text-right profile-link"
            onClick={handleShow}
          >
            {/* left 4 and right 4 characters of address */}
            <b>
              {selectedAddress.slice(0, 4)}...
              {selectedAddress.slice(-4)}
            </b>{" "}
            <PersonFill size={30} className="ml-2" />
          </span>
        </div>
      </div>
      <Modal show={showModal} onHide={handleClose} dialogClassName="modal-card">
          <Modal.Header closeButton>
            <Modal.Title>{selectedAddress}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group>
                <Form.Label>Screenname</Form.Label>
                <Form.Control type="text" placeholder="Enter your screenname" />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>
              Close
            </Button>
            <Button variant="primary" onClick={handleClose}>
              Save Changes
            </Button>
          </Modal.Footer>
      </Modal>
    </>
  );
}
