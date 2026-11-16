#import <UIKit/UIKit.h>
#import <XCTest/XCTest.h>

@interface expennsesappTests : XCTestCase
@end

@implementation expennsesappTests

- (BOOL)view:(UIView *)view containsLabel:(NSString *)label
{
  if ([view.accessibilityLabel isEqualToString:label] ||
      ([view isKindOfClass:[UITextField class]] &&
       [((UITextField *)view).placeholder isEqualToString:label])) {
    return YES;
  }
  for (UIView *subview in view.subviews) {
    if ([self view:subview containsLabel:label]) {
      return YES;
    }
  }
  return NO;
}

- (BOOL)screenContainsLabel:(NSString *)label
{
  for (UIScene *scene in UIApplication.sharedApplication.connectedScenes) {
    if (![scene isKindOfClass:[UIWindowScene class]]) {
      continue;
    }
    for (UIWindow *window in ((UIWindowScene *)scene).windows) {
      if ([self view:window containsLabel:label]) {
        return YES;
      }
    }
  }
  return NO;
}

- (void)testLoginScreenShowsEmailAndPasswordFields
{
  NSDate *deadline = [NSDate dateWithTimeIntervalSinceNow:60];
  while ([deadline timeIntervalSinceNow] > 0 &&
         !([self screenContainsLabel:@"Email"] && [self screenContainsLabel:@"Hasło"])) {
    [[NSRunLoop mainRunLoop] runMode:NSDefaultRunLoopMode
                          beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
  }
  XCTAssertTrue([self screenContainsLabel:@"Email"], @"Login screen email field was not rendered");
  XCTAssertTrue([self screenContainsLabel:@"Hasło"], @"Login screen password field was not rendered");
}

@end
