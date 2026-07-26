import Link from "next/link";
import SitePreview from "./SitePreview";
import type { Project } from "@/lib/projects";

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="pcard">
      <Link
        href={`/portfolio/${project.slug}/`}
        className="pcard__thumb"
        style={{ "--pcard-accent": project.accent } as React.CSSProperties}
        aria-label={`View the ${project.name} concept project`}
      >
        <SitePreview
          url={project.url}
          title={`${project.name} preview`}
          scale={0.28}
        />
        <span className="pcard__concept">Concept website</span>
        <span className="pcard__peek">View project</span>
      </Link>
      <div className="pcard__body">
        <div className="pcard__toprow">
          <span className="pcard__industry">{project.industry}</span>
          <span className="pcard__style">{project.styleLabel}</span>
        </div>
        <h3 className="pcard__name">{project.name}</h3>
        <p className="pcard__desc">{project.tagline}</p>
        <Link
          href={`/portfolio/${project.slug}/`}
          className="btn btn--frost pcard__btn"
        >
          View project
        </Link>
      </div>
    </article>
  );
}
