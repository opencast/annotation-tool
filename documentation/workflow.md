# workflow

Example Workflow to Publish Annotation to "annotation" publication-channel.

    <?xml version="1.0" encoding="UTF-8"?>
    <definition xmlns="http://workflow.opencastproject.org">

      <id>ng-partial-publish</id>
      <title>Publish the recording</title>
      <tags/>
      <description/>

      <configuration_panel/>
      <operations>

     <operation
        id="publish-configure"
          exception-handler-workflow="ng-partial-error"
          description="Publish to preview publication channel">
          <configurations>
            <configuration key="source-tags">preview</configuration>
            <configuration key="channel-id">annotation</configuration>
            <configuration key="url-pattern">http://localhost:8080/annotations-tool/index.html?id=${event_id}</configuration>
          </configurations>
        </operation>


      </operations>

    </definition>
