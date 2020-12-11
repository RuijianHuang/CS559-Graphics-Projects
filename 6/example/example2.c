// NOTE: VERTEX
precision highp float;
attribute vec3 position;
attribute vec3 normal;
uniform mat3 normalMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
varying vec3 fNormal;
varying vec3 fPosition;

uniform float time;

const float pi=3.14159;
varying vec3 modelX;
varying vec3 modelN;
varying vec3 rawX;

vec2 Rotate2D(vec2 vec_in, float angle)
{
  vec2 vec_out;
  vec_out.x=cos(angle)*vec_in.x-sin(angle)*vec_in.y;
  vec_out.y=sin(angle)*vec_in.x+cos(angle)*vec_in.y;
  return vec_out;
}

void main()
{
  modelX=position;
  rawX=position;
  modelN=normal;  
  
  // Comment these lines out to stop twisting
  modelX.xz = Rotate2D(modelX.xz,0.5*pi*modelX.y*sin(10.0*time)); // Try commenting out *just* this line :)
  modelN.xz = Rotate2D(modelN.xz,0.5*pi*modelX.y*sin(10.0*time)); // This is simple as that only since the transform is rotation
  
  fNormal = normalize(normalMatrix * modelN);
  vec4 pos = modelViewMatrix * vec4(modelX, 1.0);
  fPosition = pos.xyz;
  gl_Position = projectionMatrix * pos;
}

// NOTE: FRAGMENT
precision highp float;
uniform float time;
uniform vec2 resolution;
varying vec3 fPosition;
varying vec3 fNormal;
varying vec3 rawX;

const vec3  lightV1    = vec3(0.0,1.0,0.0); // stationary light
const float lightI     = 1.0;               // only for diffuse component
const float ambientC   = 0.15;
const float diffuseC   = 0.7;
const float specularC1 = 1.0;               // For stationary light
const float specularE1 = 64.0;
const float specularE2 = 16.0;
const vec3  lightCol   = vec3(1.0,1.0,1.0);
const vec3  objectCol  = vec3(1.0,0.6,0.0); // yellow-ish orange

vec2 blinnPhongDir(vec3 lightDir, float lightInt, float Ka, float Kd, float Ks, 
                                                            float shininess)
{
  vec3 s = normalize(lightDir);
  vec3 v = normalize(-fPosition);
  vec3 n = normalize(fNormal);      // normal
  vec3 h = normalize(v+s);          // half
  float diffuse = Ka + Kd * lightInt * max(0.0, dot(n, s));
  float spec =  Ks * pow(max(0.0, dot(n,h)), shininess);
  return vec2(diffuse, spec);
}

void main()
{
  float angle      = 25.0*time;
  vec3 lightV2     = vec3(sin(angle),-0.5,cos(angle));
  float specularC2 = 0.7;  // For moving light -- make this zero to keep only stationary light

  vec3 ColorS1 = blinnPhongDir(lightV1,0.0, 0.0, 0.0, specularC1,specularE1).y*lightCol;
  vec3 ColorS2 = blinnPhongDir(lightV2,0.0, 0.0, 0.0, specularC2,specularE2).y*lightCol;
  vec3 ColorAD = blinnPhongDir(lightV1,lightI,ambientC,diffuseC,0.0 ,1.0).x*objectCol;
  gl_FragColor = vec4(ColorAD+ColorS1+ColorS2,1.0);
  
  // Stripe-discard effect -- comment out to keep solid model
  if(sin(50.0*rawX.x)>0.5) discard;
}


