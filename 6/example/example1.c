// NOTE: VERTEX
precision highp float;
attribute vec3 position;
attribute vec3 normal;
uniform mat3 normalMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
varying vec3 fNormal;

void main()
{
  fNormal = normalize(normalMatrix * normal);
  vec4 pos = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * pos;
}





// NOTE: FRAGMENT
precision highp float;
varying vec3 fNormal;
uniform float time;

void main()
{
  float theta = time*20.0;
  
  vec3 dir1 = vec3(cos(theta),0,sin(theta)); 
  vec3 dir2 = vec3(sin(theta),0,cos(theta));
  
  float diffuse1 = pow(dot(fNormal,dir1),2.0);
  float diffuse2 = pow(dot(fNormal,dir2),2.0);
  
  vec3 col1 = diffuse1 * vec3(1,0,0);
  vec3 col2 = diffuse2 * vec3(0,0,1);
  
  gl_FragColor = vec4(col1 + col2, 1.0);
}
