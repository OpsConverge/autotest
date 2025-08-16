package com.testmanagement.api;

import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import io.restassured.response.Response;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import static io.restassured.RestAssured.*;
import static org.hamcrest.Matchers.*;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public class UserApiTest {
    
    @BeforeAll
    void setUp() {
        RestAssured.baseURI = "http://localhost:4000/api";
        RestAssured.port = 4000;
    }
    
    @Test
    void testHealthCheck() {
        given()
            .when()
                .get("/health")
            .then()
                .statusCode(200)
                .body(containsString("healthy"));
    }
    
    @Test
    void testGetAllUsers() {
        given()
            .header("Accept", "application/json")
            .when()
                .get("/users")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("$", hasSize(greaterThanOrEqualTo(0)));
    }
    
    @Test
    void testCreateUser() {
        String userJson = """
            {
                "name": "John Doe",
                "email": "john@example.com",
                "age": 30
            }
            """;
        
        Response response = given()
            .header("Content-Type", "application/json")
            .header("Accept", "application/json")
            .body(userJson)
            .when()
                .post("/users")
            .then()
                .statusCode(201)
                .contentType(ContentType.JSON)
                .body("name", equalTo("John Doe"))
                .body("email", equalTo("john@example.com"))
                .body("age", equalTo(30))
                .body("id", notNullValue())
                .extract().response();
        
        // Store the user ID for cleanup or further tests
        int userId = response.jsonPath().getInt("id");
        System.out.println("Created user with ID: " + userId);
    }
    
    @Test
    void testGetUserById() {
        // First create a user
        String userJson = """
            {
                "name": "Jane Doe",
                "email": "jane@example.com",
                "age": 25
            }
            """;
        
        Response createResponse = given()
            .header("Content-Type", "application/json")
            .body(userJson)
            .when()
                .post("/users")
            .then()
                .statusCode(201)
                .extract().response();
        
        int userId = createResponse.jsonPath().getInt("id");
        
        // Then get the user by ID
        given()
            .header("Accept", "application/json")
            .when()
                .get("/users/" + userId)
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("id", equalTo(userId))
                .body("name", equalTo("Jane Doe"))
                .body("email", equalTo("jane@example.com"));
    }
    
    @Test
    void testUpdateUser() {
        // First create a user
        String userJson = """
            {
                "name": "Bob Smith",
                "email": "bob@example.com",
                "age": 35
            }
            """;
        
        Response createResponse = given()
            .header("Content-Type", "application/json")
            .body(userJson)
            .when()
                .post("/users")
            .then()
                .statusCode(201)
                .extract().response();
        
        int userId = createResponse.jsonPath().getInt("id");
        
        // Update the user
        String updateJson = """
            {
                "name": "Robert Smith",
                "email": "robert@example.com",
                "age": 36
            }
            """;
        
        given()
            .header("Content-Type", "application/json")
            .header("Accept", "application/json")
            .body(updateJson)
            .when()
                .put("/users/" + userId)
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("name", equalTo("Robert Smith"))
                .body("email", equalTo("robert@example.com"))
                .body("age", equalTo(36));
    }
    
    @Test
    void testDeleteUser() {
        // First create a user
        String userJson = """
            {
                "name": "Alice Johnson",
                "email": "alice@example.com",
                "age": 28
            }
            """;
        
        Response createResponse = given()
            .header("Content-Type", "application/json")
            .body(userJson)
            .when()
                .post("/users")
            .then()
                .statusCode(201)
                .extract().response();
        
        int userId = createResponse.jsonPath().getInt("id");
        
        // Delete the user
        given()
            .when()
                .delete("/users/" + userId)
            .then()
                .statusCode(204);
        
        // Verify user is deleted
        given()
            .header("Accept", "application/json")
            .when()
                .get("/users/" + userId)
            .then()
                .statusCode(404);
    }
    
    @Test
    void testUserNotFound() {
        given()
            .header("Accept", "application/json")
            .when()
                .get("/users/999")
            .then()
                .statusCode(404);
    }
    
    @Test
    void testCreateUserValidation() {
        // Test with missing required fields
        String invalidUserJson = """
            {
                "name": "John"
            }
            """;
        
        given()
            .header("Content-Type", "application/json")
            .body(invalidUserJson)
            .when()
                .post("/users")
            .then()
                .statusCode(400);
    }
    
    @Test
    void testCreateUserWithInvalidEmail() {
        String invalidUserJson = """
            {
                "name": "John Doe",
                "email": "invalid-email",
                "age": 30
            }
            """;
        
        given()
            .header("Content-Type", "application/json")
            .body(invalidUserJson)
            .when()
                .post("/users")
            .then()
                .statusCode(400);
    }
}
