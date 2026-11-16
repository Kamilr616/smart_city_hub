import XCTest
import UIKit

final class expennsesappUITests: XCTestCase {
  private let password = "simulator-test-password"

  private func createEmulatorUser() -> String {
    let email = "ios-\(UUID().uuidString)@example.test"
    let url = URL(string: "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-key")!
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.httpBody = try! JSONSerialization.data(withJSONObject: [
      "email": email, "password": password, "returnSecureToken": true,
    ])
    let done = expectation(description: "create local emulator account")
    var status: Int?
    var requestError: Error?
    URLSession.shared.dataTask(with: request) { _, response, error in
      status = (response as? HTTPURLResponse)?.statusCode
      requestError = error
      done.fulfill()
    }.resume()
    wait(for: [done], timeout: 20)
    XCTAssertNil(requestError, "Auth emulator must be available on localhost")
    XCTAssertEqual(status, 200, "Could not create the local test account")
    return email
  }

  private func assertChartIsRendered(_ chart: XCUIElement, file: StaticString = #filePath, line: UInt = #line) {
    XCTAssertTrue(chart.waitForExistence(timeout: 15), "Chart is missing", file: file, line: line)
    XCTAssertTrue(chart.isHittable, "Chart is not visible", file: file, line: line)
    guard let image = chart.screenshot().image.cgImage else {
      XCTFail("Could not capture chart", file: file, line: line)
      return
    }
    let width = image.width, height = image.height
    var pixels = [UInt8](repeating: 0, count: width * height * 4)
    let space = CGColorSpaceCreateDeviceRGB()
    let bitmapInfo = CGImageAlphaInfo.premultipliedLast.rawValue | CGBitmapInfo.byteOrder32Big.rawValue
    let rendered = pixels.withUnsafeMutableBytes { bytes -> Bool in
      guard let context = CGContext(data: bytes.baseAddress, width: width, height: height,
                                    bitsPerComponent: 8, bytesPerRow: width * 4,
                                    space: space, bitmapInfo: bitmapInfo) else { return false }
      context.draw(image, in: CGRect(x: 0, y: 0, width: width, height: height))
      return true
    }
    guard rendered else {
      XCTFail("Could not inspect chart screenshot", file: file, line: line)
      return
    }
    var orangePixels = 0
    for i in stride(from: 0, to: pixels.count, by: 4) {
      let r = Int(pixels[i]), g = Int(pixels[i + 1]), b = Int(pixels[i + 2])
      if r > 170 && g > 75 && g < 220 && b < 100 && r * 100 > g * 115 {
        orangePixels += 1
      }
    }
    XCTAssertGreaterThan(orangePixels, 5, "Chart data point markers were not rendered", file: file, line: line)
  }

  func testAuthenticatedDrawerGesturesAndCharts() {
    continueAfterFailure = false
    let email = createEmulatorUser()
    let app = XCUIApplication()
    app.launch()
    let emailField = app.textFields["Email"]
    XCTAssertTrue(emailField.waitForExistence(timeout: 60))

    // Anonymous users cannot reveal drawer routes by swiping from the edge.
    let start = app.coordinate(withNormalizedOffset: CGVector(dx: 0.01, dy: 0.5))
    let end = app.coordinate(withNormalizedOffset: CGVector(dx: 0.8, dy: 0.5))
    start.press(forDuration: 0.1, thenDragTo: end)
    XCTAssertFalse(app.buttons["Statystyki"].exists)
    XCTAssertTrue(emailField.exists)

    emailField.tap()
    emailField.typeText(email)
    let passwordField = app.secureTextFields["Hasło"]
    passwordField.tap()
    passwordField.typeText(password)
    passwordField.typeText("\n")
    XCTAssertTrue(app.keyboards.firstMatch.waitForNonExistence(timeout: 5), "Keyboard did not close")
    app.buttons["Zaloguj"].tap()

    let device = app.buttons["device-1"]
    XCTAssertTrue(device.waitForExistence(timeout: 30), "Login did not reach home")
    assertChartIsRendered(app.otherElements["usage-chart"])
    device.tap()
    XCTAssertTrue(app.staticTexts["Current State: ON"].waitForExistence(timeout: 5))
    app.buttons["Turn Off"].tap()
    let switchedOff = NSPredicate(format: "label CONTAINS 'OFF'")
    expectation(for: switchedOff, evaluatedWith: device)
    waitForExpectations(timeout: 5)

    // Open the actual drawer with a gesture and select the statistics screen.
    start.press(forDuration: 0.1, thenDragTo: end)
    let statistics = app.buttons["Statystyki"]
    XCTAssertTrue(statistics.waitForExistence(timeout: 10))
    statistics.tap()
    assertChartIsRendered(app.otherElements["temperature-chart"])
    app.swipeUp()
    assertChartIsRendered(app.otherElements["humidity-chart"])
    app.swipeUp()
    assertChartIsRendered(app.otherElements["pressure-chart"])
    app.buttons["Show navigation menu"].tap()
    app.buttons["Wyloguj"].tap()
    XCTAssertTrue(emailField.waitForExistence(timeout: 10))
    start.press(forDuration: 0.1, thenDragTo: end)
    XCTAssertFalse(app.buttons["Statystyki"].exists)
  }
}
