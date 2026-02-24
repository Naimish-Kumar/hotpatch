require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "rn-ota-sdk"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = "https://github.com/hotpatch/rn-ota-sdk"
  s.license      = "MIT"
  s.authors      = { "HotPatch Team" => "support@hotpatch.com" }
  s.platforms    = { :ios => "12.0" }
  s.source       = { :git => "https://github.com/hotpatch/rn-ota-sdk.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm,swift}"

  s.dependency "React-Core"
end
