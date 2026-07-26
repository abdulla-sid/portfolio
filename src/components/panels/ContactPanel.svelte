<script lang="ts">
  import ContactForm from "../contact/ContactForm.svelte";
</script>

<p class="contact-lede">
  Got a project, a job, or a playlist suggestion? Drop me a line.
</p>
<div class="contact-slot"><ContactForm /></div>

<style>
  .contact-lede {
    margin-bottom: 30px;
  }

  .contact-slot {
    max-width: 640px;
  }

  @media (max-width: 900px) {
    .contact-lede {
      margin-bottom: 32px;
      padding-bottom: 6px;
      border-bottom: 2px dashed var(--ui-accent-deep);
    }
  }
</style>
