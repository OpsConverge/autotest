package simulations

import io.gatling.core.Predef._
import io.gatling.http.Predef._
import scala.concurrent.duration._

class LoadTest extends Simulation {

  val httpProtocol = http
    .baseUrl(sys.env.getOrElse("TEST_TARGET_URL", "http://localhost:5173"))
    .acceptHeader("text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
    .doNotTrackHeader("1")
    .acceptLanguageHeader("en-US,en;q=0.5")
    .acceptEncodingHeader("gzip, deflate")
    .userAgentHeader("Mozilla/5.0 (Windows NT 5.1; rv:31.0) Gecko/20100101 Firefox/31.0")

  val scn = scenario("Test Management App Load Test")
    .exec(http("Home Page")
      .get("/")
      .check(status.is(200))
      .check(bodyString.exists))
    .pause(1)
    .exec(http("Login Page")
      .get("/login")
      .check(status.is(200))
      .check(css("form").exists))
    .pause(2)
    .exec(http("Dashboard Page")
      .get("/dashboard")
      .check(status.is(200))
      .check(css(".dashboard").exists))
    .pause(1)
    .exec(http("API Health Check")
      .get("/api/health")
      .check(status.is(200))
      .check(jsonPath("$.status").is("ok")))
    .pause(1)
    .exec(http("Teams API")
      .get("/api/teams")
      .check(status.is(200))
      .check(jsonPath("$[*]").exists))

  val concurrentUsers = sys.env.getOrElse("CONCURRENT_USERS", "10").toInt
  val testDuration = sys.env.getOrElse("TEST_DURATION", "5").toInt

  setUp(
    scn.inject(
      rampUsers(concurrentUsers).during(testDuration.minutes)
    )
  ).protocols(httpProtocol)
    .assertions(
      global.responseTime.max.lt(2000),
      global.successfulRequests.percent.gt(95)
    )
}
