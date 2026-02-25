#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE (HotPatchSDK, NSObject)

RCT_EXTERN_METHOD(setup : (NSString *)apiUrl appId : (NSString *)
                      appId channel : (NSString *)
                          channel encryptionKey : (NSString *)encryptionKey
                              signingKey : (NSString *)signingKey)
RCT_EXTERN_METHOD(checkForUpdate : (RCTPromiseResolveBlock)
                      resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(applyUpdate : (NSDictionary *)updateJson resolver : (
    RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(getCurrentVersion : (RCTPromiseResolveBlock)
                      resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(markSuccess : (RCTPromiseResolveBlock)
                      resolve rejecter : (RCTPromiseRejectBlock)reject)

@end
