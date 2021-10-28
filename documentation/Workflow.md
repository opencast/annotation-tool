# workflow

Example Workflow to Publish Annotation to "annotation" publication-channel.

    <?xml version="1.0" encoding="UTF-8"?>
    <definition xmlns="http://workflow.opencastproject.org">

      <id>publish-annotate</id>
      <title>Publish the recording to the Opencast Annotation Tool</title>

      <operations>
        <operation
          id="publish-configure"
          exception-handler-workflow="partial-error"
          description="Publish to the Opencast Annotation Tool">
          <configurations>
            <configuration key="channel-id">annotation</configuration>
            <configuration key="url-pattern">http://localhost:8080/annotation-tool/index.html?id=${event_id}</configuration>
          </configurations>
        </operation>
      </operations>
    </definition>
