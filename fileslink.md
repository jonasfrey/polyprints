Files.link API
 1.0.0 
OAS 3.0
Developer-first file storage and global CDN service. Upload, manage, and deliver files with a simple REST API.

Files.link Support - Website
Servers

https://api.files.link - Production

Authorize
Projects
Project CRUD operations



POST
/v1/projects
Create a new project


Parameters
Cancel
No parameters

Request body

application/json
Edit Value
Schema
{
  "title": "My API Project"
}
Execute
Clear
Responses
Curl

curl -X 'POST' \
  'https://api.files.link/v1/projects' \
  -H 'accept: application/json' \
  -H 'Authorization: a0d782a4-1035-4c43-a4c0-17c72b550bdf' \
  -H 'Content-Type: application/json' \
  -d '{
  "title": "My API Project"
}'
Request URL
https://api.files.link/v1/projects
Server response
Code	Details
200	
Response body
Download
{
  "success": true,
  "projectId": "21736097-6106-4760-bb57-bafad6a94248"
}
Response headers
 access-control-allow-credentials: true 
 alt-svc: h3=":443"; ma=86400 
 cf-cache-status: DYNAMIC 
 cf-ray: 9d79e8b6fdf1ef5b-ZRH 
 content-encoding: zstd 
 content-type: application/json; charset=utf-8 
 date: Thu,05 Mar 2026 14:46:14 GMT 
 etag: W/"43-tinfxD8M+p5rnq9xJSLLCaXARVA" 
 nel: {"report_to":"cf-nel","success_fraction":0.0,"max_age":604800} 
 priority: u=1,i 
 ratelimit: "100-in-1min"; r=99; t=60,"100-in-1min"; r=98; t=60 
 ratelimit-policy: "100-in-1min"; q=100; w=60; pk=:ZmE3MWRhZTJlNmRj:,"100-in-1min"; q=100; w=60; pk=:ZmE3MWRhZTJlNmRj: 
 report-to: {"group":"cf-nel","max_age":604800,"endpoints":[{"url":"https://a.nel.cloudflare.com/report/v4?s=hGDkcoEzXUxmX6mWSsccm5Ml8xPpfh4MZFoi%2FsQ1kId5a%2BomwPqa1pZpfRCOwJwiLcvR1RDXz9px%2B7HZRpC1fXt9Y3oYDu6mWTa4huGV"}]} 
 server: cloudflare 
 server-timing: cfExtPri 
 vary: Origin 
 x-powered-by: Express 
Responses
Code	Description	Links
200	
Project created

Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "projectId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
No links
400	
Could not create project

Media type

application/json
Example Value
Schema
{
  "success": false,
  "message": "An error occurred."
}
No links
401	
API key required or invalid

No links
403	
Account blocked

No links

GET
/v1/projects/{page}
List projects (paginated)


Parameters
Try it out
Name	Description
page *
integer
(path)
page
Responses
Code	Description	Links
200	
Projects returned

Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "projects": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "title": "My Project",
      "createdAt": "2026-03-05T14:49:35.340Z",
      "ownerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
    }
  ]
}
No links
401	
API key required or invalid

No links

GET
/v1/projects/project/{id}
Get a project by ID


Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
Responses
Code	Description	Links
200	
Project returned

Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "project": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "title": "My Project",
    "createdAt": "2026-03-05T14:49:35.341Z",
    "ownerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  }
}
No links
401	
API key required or invalid

No links
404	
Project not found

No links

DELETE
/v1/projects/{id}
Delete a project


Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
Responses
Code	Description	Links
200	
Project deleted

Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string"
}
No links
400	
Deletion failed (e.g., archive retention)

No links
401	
API key required or invalid

No links
Folders
Folder CRUD operations within projects



POST
/v1/folders
Create a new folder



GET
/v1/folders/project/{projectId}
List folders in a project



GET
/v1/folders/{id}
Get a folder by ID



DELETE
/v1/folders/{id}
Delete a folder


Files
File upload, download, and management



POST
/v1/files/{folderId}
Upload files to a folder (get presigned URLs)


Parameters
Try it out
Name	Description
folderId *
string($uuid)
(path)
folderId
Request body

application/json
Example Value
Schema
{
  "filesMetadata": [
    {
      "name": "photo.jpg",
      "size": 1048576,
      "mimeType": "image/jpeg"
    }
  ]
}
Responses
Code	Description	Links
200	
Presigned upload URLs returned

Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "urls": [
    {}
  ]
}
No links
400	
Invalid input or storage limit exceeded

No links
401	
API key required or invalid

No links

GET
/v1/files/{id}
Get file details by ID


Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
Responses
Code	Description	Links
200	
File details returned

Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "data": {
    "file": {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "projectId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "folderId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "fileName": "document.pdf",
      "s3Key": "string",
      "mimeType": "application/pdf",
      "fileSize": 0,
      "private": true,
      "uploaded": true,
      "storageType": "STANDARD",
      "ownerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "createdAt": "2026-03-05T14:49:35.347Z"
    }
  }
}
No links
401	
API key required or invalid

No links
404	
File not found

No links

DELETE
/v1/files/{id}
Delete a file


Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
Responses
Code	Description	Links
200	
File deleted

Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "redirect": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
No links
401	
API key required or invalid

No links
404	
File not found

No links

GET
/v1/files/signed/{id}
Get a signed download URL for a private file


Parameters
Try it out
Name	Description
id *
string($uuid)
(path)
id
Responses
Code	Description	Links
200	
Signed URL returned

Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "url": "string"
}
No links
401	
API key required or invalid

No links

GET
/v1/files/folder/{folderId}
List files in a folder


Parameters
Try it out
Name	Description
folderId *
string($uuid)
(path)
folderId
Responses
Code	Description	Links
200	
Files returned

Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "data": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "projectId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "folderId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "fileName": "document.pdf",
      "s3Key": "string",
      "mimeType": "application/pdf",
      "fileSize": 0,
      "private": true,
      "uploaded": true,
      "storageType": "STANDARD",
      "ownerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "createdAt": "2026-03-05T14:49:35.352Z"
    }
  ]
}
No links
401	
API key required or invalid

No links

POST
/v1/files/multipart/{folderId}/initiate
Initiate a multipart upload


Parameters
Try it out
Name	Description
folderId *
string($uuid)
(path)
folderId
Request body

application/json
Example Value
Schema
{
  "fileMetadata": {
    "name": "photo.jpg",
    "size": 1048576,
    "mimeType": "image/jpeg"
  }
}
Responses
Code	Description	Links
200	
Multipart upload initiated

Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "data": {}
}
No links
400	
Invalid input

No links
401	
API key required or invalid

No links

POST
/v1/files/multipart/complete
Complete a multipart upload


Parameters
Try it out
No parameters

Request body

application/json
Example Value
Schema
{
  "bucket": "string",
  "key": "string",
  "uploadId": "string",
  "parts": [
    {
      "PartNumber": 1,
      "ETag": "\"d41d8cd98f00b204e9800998ecf8427e\""
    }
  ],
  "fileId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
Responses
Code	Description	Links
200	
Upload completed

No links
400	
Invalid input

No links
401	
API key required or invalid

No links

POST
/v1/files/multipart/abort
Abort a multipart upload


Parameters
Try it out
No parameters

Request body

application/json
Example Value
Schema
{
  "bucket": "string",
  "key": "string",
  "uploadId": "string",
  "fileId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
Responses
Code	Description	Links
200	
Upload aborted

No links
400	
Invalid input

No links
401	
API key required or invalid

No links
Permanent Links
Permanent shareable file links



POST
/v1/p
Create a permanent link for a file


Parameters
Try it out
No parameters

Request body

application/json
Example Value
Schema
{
  "fileId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
Responses
Code	Description	Links
200	
Permanent link created

Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "link": "string",
  "message": "string"
}
No links
401	
API key required or invalid

No links

GET
/v1/p/file/{fileId}
Get the permanent link for a file



DELETE
/v1/p/{fileId}
Delete a permanent link



GET
/v1/p/{pLinkId}
Access a file by its permanent link (public, no auth)


Schemas
Error{
success	[...]
message	[...]
}
Success{
success	[...]
message	[...]
}
Project{
id	[...]
title	[...]
createdAt	[...]
ownerId	[...]
}
Folder{
id	[...]
title	[...]
createdAt	[...]
projectId	[...]
ownerId	[...]
parentFolderId	[...]
private	[...]
storageType	[...]
}
File{
id	[...]
projectId	[...]
folderId	[...]
fileName	[...]
s3Key	[...]
mimeType	[...]
fileSize	[...]
private	[...]
uploaded	[...]
storageType	[...]
ownerId	[...]
createdAt	[...]
}
FileMetadata{
name*	[...]
size*	[...]
mimeType	[...]
}
MultipartPart{
PartNumber*	[...]
ETag*	[...]
}