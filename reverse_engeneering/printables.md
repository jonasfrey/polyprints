model name 
<input id="f-name-20" aria-invalid="false" aria-errormessage="f-name-20-error-wrapper" class="form-control svelte-5037an" placeholder="Descriptive names are better">
---
summary 
<textarea id="f-summary-21" aria-invalid="false" aria-errormessage="f-summary-21-error-wrapper" class="form-control summary svelte-1t1tmol" maxlength="120" placeholder="Enter short summary about the model"></textarea>
value should always be - low polygon figurine: ${name_model}

---
<button id="f-category-22" aria-invalid="false" aria-errormessage="f-category-22-error-wrapper" type="button" class="f svelte-1nwnng3"><!----><span class="placeholder svelte-1nwnng3">Select the best fitting</span><!----> <span class="arrow svelte-1nwnng3"><i class="fa-light fa-chevron-down svelte-1nwnng3"></i></span></button>
this is a custom select element, if this can be set with js
value should be :"Action Figures & Statues"

---

<div class="form-control svelte-1s4qrwt"><div class="tags svelte-1s4qrwt"><!----> <input aria-invalid="false" aria-errormessage="f-tags-21-error-wrapper" id="f-tags-21" placeholder="e.g. &quot;fender&quot; (without quotes). Use space to separate tags" class="svelte-1s4qrwt"></div></div>
this is a special element where keywords categories can be added found or deleted, if this is settable via js, keywords should be : 
lowpoly
polyprints
figurines
figures

---

<fieldset id="f-authorship-22" aria-invalid="false" aria-errormessage="f-authorship-22-error-wrapper" class="svelte-5037an"><legend>Model origin – this is a…</legend> <div class="radio svelte-74e3gm"><label class="svelte-74e3gm"><input type="radio" class="svelte-74e3gm" name="authorship"> Original model – I made it</label> <div class="description svelte-74e3gm">I am uploading a new model.</div><!----></div><!----> <div class="radio svelte-74e3gm"><label class="svelte-74e3gm"><input type="radio" class="svelte-74e3gm" name="authorship"> Remix or variation of another model.</label> <div class="description svelte-74e3gm">I am uploading significant modification. Describe the modification below and select the original source.</div><!----></div><!----> <div class="radio svelte-74e3gm"><label class="svelte-74e3gm"><input type="radio" class="svelte-74e3gm" name="authorship"> Reupload of another model – respecting original license.</label> <div class="description svelte-74e3gm">I am reuploading from another website. Such model won't be rewarded with Prusameter points.</div><!----></div><!----></fieldset>

this is a selection between three options, if settable via js , value should be :
Original model – I made it
I am uploading a new model.

---
<fieldset id="f-aiGenerated-23" aria-invalid="false" aria-errormessage="f-aiGenerated-23-error-wrapper" class="svelte-5037an"><legend>Was AI used to create this model?</legend> <div class="radio svelte-74e3gm"><label class="svelte-74e3gm"><input type="radio" class="svelte-74e3gm" name="aiGenerated"> Yes — AI-assisted creation</label> <div class="description svelte-74e3gm">This model was created with the help of AI tools.</div><!----></div><!----> <div class="radio svelte-74e3gm"><label class="svelte-74e3gm"><input type="radio" class="svelte-74e3gm" name="aiGenerated"> No — fully human-made</label> <div class="description svelte-74e3gm">This model was created without AI.</div><!----></div><!----> <p class="ai-generated-disclaimer svelte-5037an">You are responsible for labeling this model correctly. Incorrect or misleading labeling may result in model removal.</p></fieldset>
---
selection between two values , if settable via js , value should be 
This model was created with the help of AI tools.

---
<div contenteditable="true" role="textbox" translate="no" class="tiptap ProseMirror" tabindex="0"><p data-placeholder="Introduce your model, create build instructions and add print tips" class="is-empty is-editor-empty"><br class="ProseMirror-trailingBreak"></p></div>

description: value should be model description

<div class="select custom-field svelte-1nwnng3"><button id="f-license-51" aria-invalid="false" aria-errormessage="f-license-51-error-wrapper" type="button" class="f svelte-1nwnng3"><!----><span class="placeholder svelte-1nwnng3">Select an appropriate licence for your files</span><!----> <span class="arrow svelte-1nwnng3"><i class="fa-light fa-chevron-down svelte-1nwnng3"></i></span></button> <!----></div>

select element if possible value should be : 


Creative Commons — Attribution — Share Alike

